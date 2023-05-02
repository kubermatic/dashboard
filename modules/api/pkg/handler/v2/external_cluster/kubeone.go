/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

package externalcluster

import (
	"context"
	"encoding/json"
	"fmt"

	semverlib "github.com/Masterminds/semver/v3"
	jsonpatch "github.com/evanphx/json-patch"

	clusterv1alpha1 "github.com/kubermatic/machine-controller/pkg/apis/cluster/v1alpha1"
	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubeonev1beta2 "k8c.io/kubeone/pkg/apis/kubeone/v1beta2"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	ksemver "k8c.io/kubermatic/v2/pkg/semver"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const ContainerdContainerRuntime = "containerd"

func importKubeOneCluster(ctx context.Context, preset *kubermaticv1.Preset, userInfoGetter func(ctx context.Context, projectID string) (*provider.UserInfo, error), project *kubermaticv1.Project, cloud *apiv2.ExternalClusterCloudSpec, clusterProvider provider.ExternalClusterProvider, privilegedClusterProvider provider.PrivilegedExternalClusterProvider) (*kubermaticv1.ExternalCluster, error) {
	isImported := resources.ExternalClusterIsImportedTrue
	kubeOneClusterObj, err := DecodeManifestFromKubeOneReq(cloud.KubeOne.Manifest)
	if err != nil {
		return nil, err
	}
	newCluster := genExternalCluster(kubeOneClusterObj.Name, project.Name, isImported)

	version, err := ksemver.NewSemver(kubeOneClusterObj.Versions.Kubernetes)
	if err != nil {
		return nil, err
	}
	newCluster.Spec.Version = *version

	if kubeOneClusterObj.ContainerRuntime.Docker != nil {
		newCluster.Spec.ContainerRuntime = resources.ContainerRuntimeDocker
	} else if kubeOneClusterObj.ContainerRuntime.Containerd != nil {
		newCluster.Spec.ContainerRuntime = resources.ContainerRuntimeContainerd
	}

	if newCluster.Spec.CloudSpec.KubeOne == nil {
		newCluster.Spec.CloudSpec.KubeOne = &kubermaticv1.ExternalClusterKubeOneCloudSpec{}
	}
	newCluster.Spec.CloudSpec.KubeOne.ProviderName, err = getKubeOneProviderName(kubeOneClusterObj, *newCluster)
	if err != nil {
		return nil, err
	}

	// this API object carries cloud credentials.
	if cloud.KubeOne.CloudSpec == nil {
		cloud.KubeOne.CloudSpec = &apiv2.KubeOneCloudSpec{}
	}
	if preset != nil {
		if cloud.KubeOne.CloudSpec, err = setKubeOneCloudCredentials(preset, newCluster.Spec.CloudSpec.KubeOne.ProviderName, *cloud.KubeOne.CloudSpec); err != nil {
			return nil, err
		}
	}

	kubermaticNamespace := resources.KubermaticNamespace
	err = clusterProvider.CreateOrUpdateKubeOneSSHSecret(ctx, kubermaticNamespace, cloud.KubeOne.SSHKey, newCluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	err = clusterProvider.CreateOrUpdateKubeOneManifestSecret(ctx, kubermaticNamespace, cloud.KubeOne.Manifest, newCluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	err = clusterProvider.CreateOrUpdateKubeOneCredentialSecret(ctx, kubermaticNamespace, *cloud.KubeOne.CloudSpec, newCluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	newCluster.Status.Condition.Phase = kubermaticv1.ExternalClusterPhaseProvisioning
	return createNewCluster(ctx, userInfoGetter, clusterProvider, privilegedClusterProvider, newCluster, project)
}

func patchKubeOneCluster(ctx context.Context,
	existingCluster *kubermaticv1.ExternalCluster,
	patchData json.RawMessage,
	secretKeySelector provider.SecretKeySelectorValueFunc,
	clusterProvider provider.ExternalClusterProvider,
	masterClient ctrlruntimeclient.Client) (*apiv2.ExternalCluster, error) {
	operation := existingCluster.Status.Condition.Phase
	if operation == kubermaticv1.ExternalClusterPhaseReconciling {
		return nil, utilerrors.NewBadRequest("Operation is not allowed: Another operation: (%s) is in progress, please wait for it to finish before starting a new operation.", operation)
	}

	version, err := clusterProvider.GetVersion(ctx, masterClient, existingCluster)
	if err != nil {
		return nil, err
	}
	currentVersion := *version
	currentContainerRuntime := existingCluster.Spec.ContainerRuntime

	existingClusterJSON, err := json.Marshal(existingCluster)
	if err != nil {
		return nil, utilerrors.NewBadRequest("cannot decode existing kubeone cluster: %v", err)
	}

	patchedClusterJSON, err := jsonpatch.MergePatch(existingClusterJSON, patchData)
	if err != nil {
		return nil, utilerrors.NewBadRequest("cannot patch kubeone cluster: %v", err)
	}

	var patchedCluster *kubermaticv1.ExternalCluster
	err = json.Unmarshal(patchedClusterJSON, &patchedCluster)
	if err != nil {
		return nil, utilerrors.NewBadRequest("cannot decode patched settings: %v", err)
	}

	desiredVersion := patchedCluster.Spec.Version
	desiredContainerRuntime := patchedCluster.Spec.ContainerRuntime
	switch {
	case !currentVersion.Equal(&desiredVersion) && currentContainerRuntime != desiredContainerRuntime:
		return nil, utilerrors.NewBadRequest("Operation not supported: cannot change version and containerRuntime at the same time")
	case !currentVersion.Equal(&desiredVersion):
		mdList, err := getKubeOneMachineDeployments(ctx, masterClient, existingCluster, clusterProvider)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		mdsVersion := make(map[string]string)
		for _, md := range mdList.Items {
			mdsVersion[md.Name] = md.Spec.Template.Spec.Versions.Kubelet
		}
		for mdName, mdVersion := range mdsVersion {
			mdVersion, err := ksemver.NewSemver(mdVersion)
			if err != nil {
				return nil, err
			}
			if currentVersion.Semver().Minor()-mdVersion.Semver().Minor() >= 1 {
				return nil, fmt.Errorf("MachineDeployment %s must be updated to match cluster version %v before updating cluster version", mdName, currentVersion)
			}
		}
	case currentContainerRuntime != desiredContainerRuntime:
		// currently only migration to containerd is supported
		if desiredContainerRuntime != ContainerdContainerRuntime {
			return nil, fmt.Errorf("Operation not supported: Only migration from docker to containerd is supported, desiredContainerRuntime: %s", desiredContainerRuntime)
		}
	}

	if err := masterClient.Update(ctx, patchedCluster); err != nil {
		return nil, fmt.Errorf("failed to update kubeone external cluster %s: %w", existingCluster.Name, err)
	}

	return convertClusterToAPI(patchedCluster), nil
}

func getKubeOneMachineDeployment(ctx context.Context, masterClient ctrlruntimeclient.Client, mdName string, cluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider) (*clusterv1alpha1.MachineDeployment, error) {
	machineDeployment := &clusterv1alpha1.MachineDeployment{}
	userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
	if err != nil {
		return nil, err
	}
	if err := userClusterClient.Get(ctx, types.NamespacedName{Name: mdName, Namespace: metav1.NamespaceSystem}, machineDeployment); err != nil && !meta.IsNoMatchError(err) {
		return nil, fmt.Errorf("failed to get MachineDeployment: %w", err)
	}
	return machineDeployment, nil
}

func getKubeOneMachineDeployments(ctx context.Context, masterClient ctrlruntimeclient.Client, cluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider) (*clusterv1alpha1.MachineDeploymentList, error) {
	mdList := &clusterv1alpha1.MachineDeploymentList{}
	userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
	if err != nil {
		return nil, err
	}
	if err := userClusterClient.List(ctx, mdList); err != nil {
		return nil, fmt.Errorf("failed to list MachineDeployment: %w", err)
	}
	return mdList, nil
}

func patchKubeOneMachineDeployment(ctx context.Context, masterClient ctrlruntimeclient.Client, machineDeployment *clusterv1alpha1.MachineDeployment, oldmd, newmd *apiv2.ExternalClusterMachineDeployment, cluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider) (*apiv2.ExternalClusterMachineDeployment, error) {
	currentVersion := oldmd.NodeDeployment.Spec.Template.Versions.Kubelet
	desiredVersion := newmd.NodeDeployment.Spec.Template.Versions.Kubelet
	if desiredVersion != currentVersion {
		machineDeployment.Spec.Template.Spec.Versions.Kubelet = desiredVersion
		userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
		if err != nil {
			return nil, err
		}
		if err := userClusterClient.Update(ctx, machineDeployment); err != nil && !meta.IsNoMatchError(err) {
			return nil, fmt.Errorf("failed to update MachineDeployment: %w", err)
		}
		return newmd, nil
	}

	currentReplicas := oldmd.NodeDeployment.Spec.Replicas
	desiredReplicas := newmd.NodeDeployment.Spec.Replicas
	if desiredReplicas != currentReplicas {
		machineDeployment.Spec.Replicas = &desiredReplicas
		userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
		if err != nil {
			return nil, err
		}
		if err := userClusterClient.Update(ctx, machineDeployment); err != nil && !meta.IsNoMatchError(err) {
			return nil, fmt.Errorf("failed to update MachineDeployment: %w", err)
		}
		return newmd, nil
	}

	return oldmd, nil
}

func getKubeOneAPIMachineDeployment(ctx context.Context,
	masterClient ctrlruntimeclient.Client,
	mdName string,
	cluster *kubermaticv1.ExternalCluster,
	clusterProvider provider.ExternalClusterProvider) (*apiv2.ExternalClusterMachineDeployment, error) {
	md, err := getKubeOneMachineDeployment(ctx, masterClient, mdName, cluster, clusterProvider)
	if err != nil {
		return nil, err
	}
	nd, err := handlercommon.OutputMachineDeployment(md)
	if err != nil {
		return nil, err
	}

	return &apiv2.ExternalClusterMachineDeployment{NodeDeployment: *nd}, nil
}

func setKubeOneCloudCredentials(preset *kubermaticv1.Preset, providerName string, kubeOneCloudSpec apiv2.KubeOneCloudSpec) (*apiv2.KubeOneCloudSpec, error) {
	// TODO: Add support for the remaining KubeOne Supported Providers.
	switch {
	case providerName == resources.KubeOneAWS:
		return setAWSCredentials(preset, kubeOneCloudSpec)
	case providerName == resources.KubeOneGCP:
		return setGCPCredentials(preset, kubeOneCloudSpec)
	case providerName == resources.KubeOneAzure:
		return setAzureCredentials(preset, kubeOneCloudSpec)
	case providerName == resources.KubeOneHetzner:
		return setHetznerCredentials(preset, kubeOneCloudSpec)
	case providerName == resources.KubeOneDigitalOcean:
		return setDigitalOceanCredentials(preset, kubeOneCloudSpec)
	}

	return nil, fmt.Errorf("Provider %s not supported", providerName)
}

func emptyCredentialError(preset, provider string) error {
	return fmt.Errorf("the preset %s doesn't contain credential for %s provider", preset, provider)
}

func setAWSCredentials(preset *kubermaticv1.Preset, kubeOneCloudSpec apiv2.KubeOneCloudSpec) (*apiv2.KubeOneCloudSpec, error) {
	if preset.Spec.AWS == nil {
		return nil, emptyCredentialError(preset.Name, "AWS")
	}

	credentials := preset.Spec.AWS

	if kubeOneCloudSpec.AWS == nil {
		kubeOneCloudSpec.AWS = &apiv2.KubeOneAWSCloudSpec{}
	}
	kubeOneCloudSpec.AWS.AccessKeyID = credentials.AccessKeyID
	kubeOneCloudSpec.AWS.SecretAccessKey = credentials.SecretAccessKey

	return &kubeOneCloudSpec, nil
}

func setGCPCredentials(preset *kubermaticv1.Preset, kubeOneCloudSpec apiv2.KubeOneCloudSpec) (*apiv2.KubeOneCloudSpec, error) {
	if preset.Spec.GCP == nil {
		return nil, emptyCredentialError(preset.Name, "GCP")
	}

	credentials := preset.Spec.GCP

	if kubeOneCloudSpec.GCP == nil {
		kubeOneCloudSpec.GCP = &apiv2.KubeOneGCPCloudSpec{}
	}
	kubeOneCloudSpec.GCP.ServiceAccount = credentials.ServiceAccount

	return &kubeOneCloudSpec, nil
}

func setAzureCredentials(preset *kubermaticv1.Preset, kubeOneCloudSpec apiv2.KubeOneCloudSpec) (*apiv2.KubeOneCloudSpec, error) {
	if preset.Spec.Azure == nil {
		return nil, emptyCredentialError(preset.Name, "AZURE")
	}

	credentials := preset.Spec.Azure

	if kubeOneCloudSpec.Azure == nil {
		kubeOneCloudSpec.Azure = &apiv2.KubeOneAzureCloudSpec{}
	}
	kubeOneCloudSpec.Azure.ClientID = credentials.ClientID
	kubeOneCloudSpec.Azure.TenantID = credentials.TenantID
	kubeOneCloudSpec.Azure.ClientSecret = credentials.ClientSecret
	kubeOneCloudSpec.Azure.SubscriptionID = credentials.SubscriptionID

	return &kubeOneCloudSpec, nil
}

func setHetznerCredentials(preset *kubermaticv1.Preset, kubeOneCloudSpec apiv2.KubeOneCloudSpec) (*apiv2.KubeOneCloudSpec, error) {
	if preset.Spec.Hetzner == nil {
		return nil, emptyCredentialError(preset.Name, "Hetzner")
	}

	credentials := preset.Spec.Hetzner

	if kubeOneCloudSpec.Hetzner == nil {
		kubeOneCloudSpec.Hetzner = &apiv2.KubeOneHetznerCloudSpec{}
	}
	kubeOneCloudSpec.Hetzner.Token = credentials.Token

	return &kubeOneCloudSpec, nil
}

func setDigitalOceanCredentials(preset *kubermaticv1.Preset, kubeOneCloudSpec apiv2.KubeOneCloudSpec) (*apiv2.KubeOneCloudSpec, error) {
	if preset.Spec.Digitalocean == nil {
		return nil, emptyCredentialError(preset.Name, "Digitalocean")
	}

	credentials := preset.Spec.Digitalocean

	if kubeOneCloudSpec.DigitalOcean == nil {
		kubeOneCloudSpec.DigitalOcean = &apiv2.KubeOneDigitalOceanCloudSpec{}
	}
	kubeOneCloudSpec.DigitalOcean.Token = credentials.Token

	return &kubeOneCloudSpec, nil
}

func getKubeOneProviderName(kubeOneCluster *kubeonev1beta2.KubeOneCluster, cluster kubermaticv1.ExternalCluster) (string, error) {
	switch {
	case kubeOneCluster.CloudProvider.AWS != nil:
		return resources.KubeOneAWS, nil
	case kubeOneCluster.CloudProvider.GCE != nil:
		return resources.KubeOneGCP, nil
	case kubeOneCluster.CloudProvider.Azure != nil:
		return resources.KubeOneAzure, nil
	case kubeOneCluster.CloudProvider.DigitalOcean != nil:
		return resources.KubeOneDigitalOcean, nil
	case kubeOneCluster.CloudProvider.Hetzner != nil:
		return resources.KubeOneHetzner, nil
	case kubeOneCluster.CloudProvider.Nutanix != nil:
		return resources.KubeOneNutanix, nil
	case kubeOneCluster.CloudProvider.Openstack != nil:
		return resources.KubeOneOpenStack, nil
	case kubeOneCluster.CloudProvider.EquinixMetal != nil:
		return resources.KubeOneEquinix, nil
	case kubeOneCluster.CloudProvider.Vsphere != nil:
		return resources.KubeOneVSphere, nil
	case kubeOneCluster.CloudProvider.VMwareCloudDirector != nil:
		return resources.KubeOneVMwareCloudDirector, nil
	}

	return "", fmt.Errorf("\"CloudProviderSpec\" Not Found in provided kubeone manifest")
}

func getKubeOneAPIMachineDeployments(ctx context.Context,
	masterClient ctrlruntimeclient.Client,
	cluster *kubermaticv1.ExternalCluster,
	clusterProvider provider.ExternalClusterProvider) ([]apiv2.ExternalClusterMachineDeployment, error) {
	mdList, err := getKubeOneMachineDeployments(ctx, masterClient, cluster, clusterProvider)
	nodeDeployments := make([]apiv2.ExternalClusterMachineDeployment, 0, len(mdList.Items))
	if err != nil {
		return nil, err
	}

	for _, md := range mdList.Items {
		nd, err := handlercommon.OutputMachineDeployment(&md)
		if err != nil {
			return nil, fmt.Errorf("failed to output machine deployment %s: %w", md.Name, err)
		}
		nodeDeployments = append(nodeDeployments, apiv2.ExternalClusterMachineDeployment{NodeDeployment: *nd})
	}

	return nodeDeployments, nil
}

func ListMachineDeploymentUpgrades(ctx context.Context,
	masterClient ctrlruntimeclient.Client,
	mdName string,
	cluster *kubermaticv1.ExternalCluster,
	clusterProvider provider.ExternalClusterProvider) ([]*apiv1.MasterVersion, error) {
	upgrades := make([]*apiv1.MasterVersion, 0)

	currentClusterVer, err := semverlib.NewVersion(cluster.Spec.Version.Semver().String())
	if err != nil {
		return nil, err
	}

	md, err := getKubeOneMachineDeployment(ctx, masterClient, mdName, cluster, clusterProvider)
	if err != nil {
		return nil, err
	}

	currentMachineDeploymentVer, err := semverlib.NewVersion(md.Spec.Template.Spec.Versions.Kubelet)
	if err != nil {
		return nil, err
	}

	if currentClusterVer.GreaterThan(currentMachineDeploymentVer) {
		upgrades = append(upgrades, &apiv1.MasterVersion{Version: currentClusterVer})
	}

	return upgrades, nil
}
