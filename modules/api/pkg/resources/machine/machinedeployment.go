/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package machine

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"

	semverlib "github.com/Masterminds/semver/v3"

	clusterv1alpha1 "github.com/kubermatic/machine-controller/pkg/apis/cluster/v1alpha1"
	"github.com/kubermatic/machine-controller/pkg/cloudprovider/util"
	providerconfig "github.com/kubermatic/machine-controller/pkg/providerconfig/types"
	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/validation"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/validation/nodeupdate"
	osmresources "k8c.io/operating-system-manager/pkg/controllers/osc/resources"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/rand"
	"k8s.io/apimachinery/pkg/util/sets"
)

const (
	AutoscalerMinSizeAnnotation = "cluster.k8s.io/cluster-api-autoscaler-node-group-min-size"
	AutoscalerMaxSizeAnnotation = "cluster.k8s.io/cluster-api-autoscaler-node-group-max-size"
)

// Deployment returns a Machine Deployment object for the given Node Deployment spec.
func Deployment(ctx context.Context, c *kubermaticv1.Cluster, nd *apiv1.NodeDeployment, dc *kubermaticv1.Datacenter, keys []*kubermaticv1.UserSSHKey, settingsProvider provider.SettingsProvider) (*clusterv1alpha1.MachineDeployment, error) {
	validationErr := validateAutoUpdateMDEnforcement(ctx, nd, settingsProvider)
	if validationErr != nil {
		return nil, validationErr
	}

	md := &clusterv1alpha1.MachineDeployment{}

	if nd.Name != "" {
		md.Name = nd.Name
	} else {
		// GenerateName can be set only if Name is empty to avoid confusing error:
		// https://github.com/kubernetes/kubernetes/issues/32220
		md.GenerateName = fmt.Sprintf("%s-worker-", c.Name)
	}

	// Add Annotations to Machine Deployment
	md.Annotations = nd.Annotations

	osp := getOperatingSystemProfile(nd, dc)
	if osp != "" {
		if md.Annotations == nil {
			md.Annotations = make(map[string]string)
		}
		md.Annotations[osmresources.MachineDeploymentOSPAnnotation] = osp
	}

	md.Namespace = metav1.NamespaceSystem
	md.Finalizers = []string{metav1.FinalizerDeleteDependents}

	md.Spec.Selector.MatchLabels = map[string]string{
		"machine": fmt.Sprintf("md-%s-%s", c.Name, rand.String(10)),
	}
	md.Spec.Template.Labels = md.Spec.Selector.MatchLabels
	md.Spec.Template.Spec.Labels = nd.Spec.Template.Labels
	if md.Spec.Template.Spec.Labels == nil {
		md.Spec.Template.Spec.Labels = make(map[string]string)
	}
	md.Spec.Template.Spec.Labels["system/cluster"] = c.Name
	projectID, ok := c.Labels[kubermaticv1.ProjectIDLabelKey]
	if ok {
		md.Spec.Template.Spec.Labels["system/project"] = projectID
	}

	var taints []corev1.Taint
	for _, taint := range nd.Spec.Template.Taints {
		taints = append(taints, corev1.Taint{
			Value:  taint.Value,
			Key:    taint.Key,
			Effect: corev1.TaintEffect(taint.Effect),
		})
	}
	md.Spec.Template.Spec.Taints = taints

	// Create a copy to avoid changing the ND when changing the MD
	replicas := nd.Spec.Replicas
	md.Spec.Replicas = &replicas

	// Set autoscaler min and max replicas if present
	if md.Annotations == nil {
		md.Annotations = map[string]string{}
	}
	max := nd.Spec.MaxReplicas
	if max != nil {
		md.Annotations[AutoscalerMaxSizeAnnotation] = strconv.Itoa(int(*max))
	} else {
		delete(md.Annotations, AutoscalerMaxSizeAnnotation)
	}

	min := nd.Spec.MinReplicas
	if min != nil {
		md.Annotations[AutoscalerMinSizeAnnotation] = strconv.Itoa(int(*min))
	} else {
		delete(md.Annotations, AutoscalerMinSizeAnnotation)
	}

	md.Spec.Template.Spec.Versions.Kubelet = nd.Spec.Template.Versions.Kubelet

	// Deprecated: This is not supported for 1.24 and higher and is blocked by
	// Validate for 1.24+. Can be removed once 1.23 support is dropped.
	if nd.Spec.DynamicConfig != nil && *nd.Spec.DynamicConfig {
		kubeletVersion, err := semverlib.NewVersion(nd.Spec.Template.Versions.Kubelet)
		if err != nil {
			return nil, fmt.Errorf("failed to parse kubelet version: %w", err)
		}

		md.Spec.Template.Spec.ConfigSource = &corev1.NodeConfigSource{
			ConfigMap: &corev1.ConfigMapNodeConfigSource{
				Namespace:        metav1.NamespaceSystem,
				Name:             fmt.Sprintf("kubelet-config-%d.%d", kubeletVersion.Major(), kubeletVersion.Minor()),
				KubeletConfigKey: "kubelet",
			},
		}
	}

	if len(c.Spec.MachineNetworks) > 0 {
		// TODO(mrIncompetent): Rename this finalizer to not contain the word "kubermatic" (For whitelabeling purpose)
		md.Spec.Template.Annotations = map[string]string{
			"machine-controller.kubermatic.io/initializers": "ipam",
		}
	}

	if nd.Spec.Paused != nil {
		md.Spec.Paused = *nd.Spec.Paused
	}

	config, err := getProviderConfig(c, nd, dc, keys)
	if err != nil {
		return nil, err
	}

	err = getProviderOS(config, nd)
	if err != nil {
		return nil, err
	}

	b, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}

	md.Spec.Template.Spec.ProviderSpec.Value = &runtime.RawExtension{Raw: b}

	return md, nil
}

//gocyclo:ignore
func getProviderConfig(c *kubermaticv1.Cluster, nd *apiv1.NodeDeployment, dc *kubermaticv1.Datacenter, keys []*kubermaticv1.UserSSHKey) (*providerconfig.Config, error) {
	config := providerconfig.Config{}
	config.SSHPublicKeys = make([]string, len(keys))
	for i, key := range keys {
		config.SSHPublicKeys[i] = key.Spec.PublicKey
	}

	var (
		cloudExt *runtime.RawExtension
		err      error
	)

	switch {
	case nd.Spec.Template.Cloud.AWS != nil && dc.Spec.AWS != nil:
		config.CloudProvider = providerconfig.CloudProviderAWS
		cloudExt, err = getAWSProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Azure != nil && dc.Spec.Azure != nil:
		config.CloudProvider = providerconfig.CloudProviderAzure
		cloudExt, err = getAzureProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.VSphere != nil && dc.Spec.VSphere != nil:
		config.CloudProvider = providerconfig.CloudProviderVsphere
		cloudExt, err = getVSphereProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Baremetal != nil && dc.Spec.Baremetal != nil:
		config.CloudProvider = providerconfig.CloudProviderBaremetal
		cloudExt, err = getBaremetalProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Openstack != nil && dc.Spec.Openstack != nil:
		config.CloudProvider = providerconfig.CloudProviderOpenstack
		if err := validation.ValidateCreateNodeSpec(c, &nd.Spec.Template, dc); err != nil {
			return nil, err
		}

		cloudExt, err = getOpenstackProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Hetzner != nil && dc.Spec.Hetzner != nil:
		config.CloudProvider = providerconfig.CloudProviderHetzner
		cloudExt, err = getHetznerProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Digitalocean != nil && dc.Spec.Digitalocean != nil:
		config.CloudProvider = providerconfig.CloudProviderDigitalocean
		cloudExt, err = getDigitaloceanProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Packet != nil && dc.Spec.Packet != nil:
		config.CloudProvider = providerconfig.CloudProviderPacket
		cloudExt, err = getPacketProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Edge != nil && dc.Spec.Edge != nil:
		config.CloudProvider = providerconfig.CloudProviderEdge
		cloudExt = &runtime.RawExtension{}
	case nd.Spec.Template.Cloud.GCP != nil && dc.Spec.GCP != nil:
		config.CloudProvider = providerconfig.CloudProviderGoogle
		cloudExt, err = getGCPProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Kubevirt != nil && dc.Spec.Kubevirt != nil:
		config.CloudProvider = providerconfig.CloudProviderKubeVirt
		cloudExt, err = getKubevirtProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Alibaba != nil && dc.Spec.Alibaba != nil:
		config.CloudProvider = providerconfig.CloudProviderAlibaba
		cloudExt, err = getAlibabaProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Anexia != nil && dc.Spec.Anexia != nil:
		config.CloudProvider = providerconfig.CloudProviderAnexia
		cloudExt, err = getAnexiaProviderSpec(nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.Nutanix != nil && dc.Spec.Nutanix != nil:
		config.CloudProvider = providerconfig.CloudProviderNutanix
		cloudExt, err = getNutanixProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	case nd.Spec.Template.Cloud.VMwareCloudDirector != nil && dc.Spec.VMwareCloudDirector != nil:
		config.CloudProvider = providerconfig.CloudProviderVMwareCloudDirector
		cloudExt, err = getVMwareCloudDirectorProviderSpec(c, nd.Spec.Template, dc)
		if err != nil {
			return nil, err
		}
	default:
		return nil, errors.New("unknown cloud provider or cloud provider mismatch between node and datacenter")
	}
	config.CloudProviderSpec = *cloudExt

	if nd.Spec.Template.Network != nil {
		config.Network = &providerconfig.NetworkConfig{
			CIDR:     nd.Spec.Template.Network.CIDR,
			Gateway:  nd.Spec.Template.Network.Gateway,
			DNS:      nd.Spec.Template.Network.DNS,
			IPFamily: util.IPFamily(nd.Spec.Template.Network.IPFamily),
		}
	}

	if config.Network == nil {
		config.Network = &providerconfig.NetworkConfig{}
	}

	switch {
	case c.IsIPv4Only():
		config.Network.IPFamily = util.IPFamilyIPv4
	case c.IsIPv6Only():
		config.Network.IPFamily = util.IPFamilyIPv6
	case c.IsDualStack():
		config.Network.IPFamily = util.IPFamilyIPv4IPv6
	default:
		config.Network.IPFamily = util.IPFamilyUnspecified
	}

	return &config, nil
}

func getOperatingSystemProfile(nd *apiv1.NodeDeployment, dc *kubermaticv1.Datacenter) string {
	if dc.Spec.DefaultOperatingSystemProfiles == nil {
		return ""
	}

	// OS specifics
	switch {
	case nd.Spec.Template.OperatingSystem.Ubuntu != nil:
		return dc.Spec.DefaultOperatingSystemProfiles[providerconfig.OperatingSystemUbuntu]
	case nd.Spec.Template.OperatingSystem.CentOS != nil:
		return dc.Spec.DefaultOperatingSystemProfiles[providerconfig.OperatingSystemCentOS]
	case nd.Spec.Template.OperatingSystem.RHEL != nil:
		return dc.Spec.DefaultOperatingSystemProfiles[providerconfig.OperatingSystemRHEL]
	case nd.Spec.Template.OperatingSystem.Flatcar != nil:
		return dc.Spec.DefaultOperatingSystemProfiles[providerconfig.OperatingSystemFlatcar]
	case nd.Spec.Template.OperatingSystem.RockyLinux != nil:
		return dc.Spec.DefaultOperatingSystemProfiles[providerconfig.OperatingSystemRockyLinux]
	case nd.Spec.Template.OperatingSystem.AmazonLinux != nil:
		return dc.Spec.DefaultOperatingSystemProfiles[providerconfig.OperatingSystemAmazonLinux2]
	default:
		return ""
	}
}

func getProviderOS(config *providerconfig.Config, nd *apiv1.NodeDeployment) error {
	var (
		err   error
		osExt *runtime.RawExtension
	)

	// OS specifics
	switch {
	case nd.Spec.Template.OperatingSystem.Ubuntu != nil:
		config.OperatingSystem = providerconfig.OperatingSystemUbuntu
		osExt, err = getUbuntuOperatingSystemSpec(nd.Spec.Template)
		if err != nil {
			return err
		}
	case nd.Spec.Template.OperatingSystem.CentOS != nil:
		config.OperatingSystem = providerconfig.OperatingSystemCentOS
		osExt, err = getCentOSOperatingSystemSpec(nd.Spec.Template)
		if err != nil {
			return err
		}
	case nd.Spec.Template.OperatingSystem.RHEL != nil:
		config.OperatingSystem = providerconfig.OperatingSystemRHEL
		osExt, err = getRHELOperatingSystemSpec(nd.Spec.Template)
		if err != nil {
			return err
		}
	case nd.Spec.Template.OperatingSystem.Flatcar != nil:
		config.OperatingSystem = providerconfig.OperatingSystemFlatcar
		osExt, err = getFlatcarOperatingSystemSpec(nd.Spec.Template)
		if err != nil {
			return err
		}
	case nd.Spec.Template.OperatingSystem.RockyLinux != nil:
		config.OperatingSystem = providerconfig.OperatingSystemRockyLinux
		osExt, err = getRockyLinuxOperatingSystemSpec(nd.Spec.Template)
		if err != nil {
			return err
		}
	case nd.Spec.Template.OperatingSystem.AmazonLinux != nil:
		config.OperatingSystem = providerconfig.OperatingSystemAmazonLinux2
		osExt, err = getAmazonLinuxOperatingSystemSpec(nd.Spec.Template)
		if err != nil {
			return err
		}
	default:
		return errors.New("no machine os was provided")
	}
	config.OperatingSystemSpec = *osExt

	return nil
}

// Validate if the node deployment structure fulfills certain requirements. It returns node deployment with updated
// kubelet version if it wasn't specified.
func Validate(nd *apiv1.NodeDeployment, controlPlaneVersion *semverlib.Version) (*apiv1.NodeDeployment, error) {
	if nd.Spec.Template.Cloud.Openstack == nil &&
		nd.Spec.Template.Cloud.Digitalocean == nil &&
		nd.Spec.Template.Cloud.AWS == nil &&
		nd.Spec.Template.Cloud.Hetzner == nil &&
		nd.Spec.Template.Cloud.VSphere == nil &&
		nd.Spec.Template.Cloud.Azure == nil &&
		nd.Spec.Template.Cloud.Packet == nil &&
		nd.Spec.Template.Cloud.GCP == nil &&
		nd.Spec.Template.Cloud.Kubevirt == nil &&
		nd.Spec.Template.Cloud.Alibaba == nil &&
		nd.Spec.Template.Cloud.Anexia == nil &&
		nd.Spec.Template.Cloud.Nutanix == nil &&
		nd.Spec.Template.Cloud.Edge == nil &&
		nd.Spec.Template.Cloud.VMwareCloudDirector == nil {
		return nil, fmt.Errorf("node deployment needs to have cloud provider data")
	}

	var (
		kubeletVersion *semverlib.Version
		err            error
	)

	if nd.Spec.Template.Versions.Kubelet != "" {
		kubeletVersion, err = semverlib.NewVersion(nd.Spec.Template.Versions.Kubelet)
		if err != nil {
			return nil, fmt.Errorf("failed to parse kubelet version: %w", err)
		}

		if err = nodeupdate.EnsureVersionCompatible(controlPlaneVersion, kubeletVersion); err != nil {
			return nil, err
		}
	} else {
		kubeletVersion = controlPlaneVersion
	}

	nd.Spec.Template.Versions.Kubelet = kubeletVersion.String()

	constraint124, err := semverlib.NewConstraint(">= 1.24")
	if err != nil {
		return nil, fmt.Errorf("failed to parse 1.24 constraint: %w", err)
	}

	if nd.Spec.DynamicConfig != nil && *nd.Spec.DynamicConfig && constraint124.Check(kubeletVersion) {
		return nil, errors.New("dynamic config cannot be configured for Kubernetes 1.24 or higher")
	}

	// The default
	allowedTaintEffects := sets.New(
		string(corev1.TaintEffectNoExecute),
		string(corev1.TaintEffectNoSchedule),
		string(corev1.TaintEffectPreferNoSchedule),
	)
	for _, taint := range nd.Spec.Template.Taints {
		if taint.Key == "" {
			return nil, errors.New("taint key must be set")
		}
		if taint.Value == "" {
			return nil, errors.New("taint value must be set")
		}
		if !allowedTaintEffects.Has(taint.Effect) {
			return nil, fmt.Errorf("taint effect '%s' not allowed. Allowed: %s", taint.Effect, strings.Join(sets.List(allowedTaintEffects), ", "))
		}
	}

	return nd, nil
}

// validateAutoUpdateMDEnforcement validates if auto-update settings of node deployment are aligned with the
// admin settings of machine deployment auto updates.
func validateAutoUpdateMDEnforcement(ctx context.Context, nd *apiv1.NodeDeployment, settingsProvider provider.SettingsProvider) error {
	settings, err := settingsProvider.GetGlobalSettings(ctx)

	if err != nil {
		return common.KubernetesErrorToHTTPError(err)
	}

	mdOptions := settings.Spec.MachineDeploymentOptions

	if mdOptions.AutoUpdatesEnabled && mdOptions.AutoUpdatesEnforced {
		errorMessage := errors.New("auto update cannot be disabled because it has been enforced by the admin")
		osSpec := nd.Spec.Template.OperatingSystem
		// OS specifics
		switch {
		case osSpec.Ubuntu != nil:
			if !osSpec.Ubuntu.DistUpgradeOnBoot {
				return errorMessage
			}
		case osSpec.CentOS != nil:
			if !osSpec.CentOS.DistUpgradeOnBoot {
				return errorMessage
			}
		case osSpec.RHEL != nil:
			if !osSpec.RHEL.DistUpgradeOnBoot {
				return errorMessage
			}
		case osSpec.Flatcar != nil:
			if osSpec.Flatcar.DisableAutoUpdate {
				return errorMessage
			}
		case osSpec.RockyLinux != nil:
			if !osSpec.RockyLinux.DistUpgradeOnBoot {
				return errorMessage
			}
		case osSpec.AmazonLinux != nil:
			if !osSpec.AmazonLinux.DistUpgradeOnBoot {
				return errorMessage
			}
		default:
			return errors.New("no machine os was provided")
		}
	}

	return nil
}
