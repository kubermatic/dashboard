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

package clusterdefault

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	clusterv2 "k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/handler/v2/networkdefaults"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticprovider "k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/defaulting"
	"k8c.io/kubermatic/v2/pkg/resources"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/ptr"
)

// getDefaultClusterReq represents a request for retrieving a default spec for the cluster.
// swagger:parameters getDefaultCluster
type getDefaultClusterReq struct {
	// in: path
	// required: true
	ProviderName string `json:"provider_name"`
	// in: path
	// required: true
	DC string `json:"dc"`

	// private field for the seed name. Needed for the cluster provider.
	seedName string
}

// GetSeedCluster returns the SeedCluster object.
func (req getDefaultClusterReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		SeedName: req.seedName,
	}
}

// Validate validates getDefaultClusterReq request.
func (r getDefaultClusterReq) Validate() error {
	if r.ProviderName == "" {
		return fmt.Errorf("the provider name cannot be empty")
	}
	if !kubermaticv1.IsProviderSupported(r.ProviderName) {
		return fmt.Errorf("unsupported provider: %q", r.ProviderName)
	}
	if r.DC == "" {
		return fmt.Errorf("the datacenter cannot be empty")
	}
	return nil
}

func DecodeGetDefaultClusterReq(ctx context.Context, r *http.Request) (interface{}, error) {
	req := getDefaultClusterReq{
		ProviderName: mux.Vars(r)["provider_name"],
		DC:           mux.Vars(r)["dc"],
	}

	seedName, err := clusterv2.FindSeedNameForDatacenter(ctx, req.DC)
	if err != nil {
		return nil, err
	}
	req.seedName = seedName

	return req, nil
}

// GetDefaultClusterEndpoint returns the default generated cluster spec for the given provider.
func GetDefaultClusterEndpoint(
	seedsGetter kubermaticprovider.SeedsGetter,
	userInfoGetter kubermaticprovider.UserInfoGetter,
	configGetter provider.KubermaticConfigurationGetter,
) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(getDefaultClusterReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		// Order of priority for defaulting sources:
		// 1. Seed configuration.
		// 2. Kubermatic configuration.
		// 3. Seed scoped default Cluster Template.
		//
		// Start generation of the default cluster.
		defaultCluster := &kubermaticv1.Cluster{}
		defaultCluster.Labels = make(map[string]string)
		defaultCluster.Annotations = make(map[string]string)

		// 1. Retrieve KubermaticConfiguration.
		config, err := configGetter(ctx)
		if err != nil {
			return nil, err
		}

		// 2. Retrieve Seed.
		adminUserInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		seed, _, err := kubermaticprovider.DatacenterFromSeedMap(adminUserInfo, seedsGetter, req.DC)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		// 3. Retrieve default Cluster Template.
		privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(kubermaticprovider.PrivilegedClusterProvider)
		seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()

		defaultingTemplate, err := defaulting.GetDefaultingClusterTemplate(ctx, seedClient, seed)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		// 4. Retrieve and default Cluster Networking configurations.
		defaultClusterNetwork := networkdefaults.GenerateNetworkDefaults(kubermaticv1.ProviderType(req.ProviderName), seed, config, defaultingTemplate)
		defaultCluster = mapNetworkDefaultsToCluster(defaultClusterNetwork, defaultCluster)

		// 5. Defaulting for Cluster Spec.
		defaultCluster, err = defaultClusterSpec(ctx, kubermaticv1.ProviderType(req.ProviderName), req.DC, seed, config, defaultingTemplate, defaultCluster)
		if err != nil {
			return nil, err
		}
		return convertInternalDefaultClusterToExternal(defaultCluster), nil
	}
}

func mapNetworkDefaultsToCluster(networkDefaults apiv2.NetworkDefaults, cluster *kubermaticv1.Cluster) *kubermaticv1.Cluster {
	cluster.Spec.ExposeStrategy = networkDefaults.ClusterExposeStrategy
	if cluster.Spec.ExposeStrategy == kubermaticv1.ExposeStrategyTunneling {
		cluster.Spec.ClusterNetwork.TunnelingAgentIP = networkDefaults.TunnelingAgentIP
	}
	cluster.Spec.ClusterNetwork.ProxyMode = networkDefaults.ProxyMode
	cluster.Spec.ClusterNetwork.NodeLocalDNSCacheEnabled = ptr.To(networkDefaults.NodeLocalDNSCacheEnabled)
	cluster.Spec.ClusterNetwork.IPFamily = kubermaticv1.IPFamilyIPv4 // always use IPv4 as the default address family (even if IPv6 defaults are provided)

	// Mapping for IPv4
	if networkDefaults.IPv4 != nil {
		cluster.Spec.ClusterNetwork.NodeCIDRMaskSizeIPv4 = ptr.To[int32](networkDefaults.IPv4.NodeCIDRMaskSize)

		if networkDefaults.IPv4.PodsCIDR != "" {
			cluster.Spec.ClusterNetwork.Pods = kubermaticv1.NetworkRanges{
				CIDRBlocks: []string{networkDefaults.IPv4.PodsCIDR},
			}
		}

		if networkDefaults.IPv4.ServicesCIDR != "" {
			cluster.Spec.ClusterNetwork.Services = kubermaticv1.NetworkRanges{
				CIDRBlocks: []string{networkDefaults.IPv4.ServicesCIDR},
			}
		}
	}

	// Mapping for IPv6
	if networkDefaults.IPv6 != nil {
		cluster.Spec.ClusterNetwork.NodeCIDRMaskSizeIPv6 = ptr.To[int32](networkDefaults.IPv6.NodeCIDRMaskSize)

		if networkDefaults.IPv6.PodsCIDR != "" {
			cluster.Spec.ClusterNetwork.Pods = kubermaticv1.NetworkRanges{
				CIDRBlocks: []string{networkDefaults.IPv4.PodsCIDR, networkDefaults.IPv6.PodsCIDR},
			}
		}

		if networkDefaults.IPv6.ServicesCIDR != "" {
			cluster.Spec.ClusterNetwork.Services = kubermaticv1.NetworkRanges{
				CIDRBlocks: []string{networkDefaults.IPv4.ServicesCIDR, networkDefaults.IPv6.ServicesCIDR},
			}
		}
	}
	return cluster
}

func defaultClusterSpec(ctx context.Context, provider kubermaticv1.ProviderType, dc string, seed *kubermaticv1.Seed, config *kubermaticv1.KubermaticConfiguration, defaultClusterTemplate *kubermaticv1.ClusterTemplate, cluster *kubermaticv1.Cluster) (*kubermaticv1.Cluster, error) {
	cluster.Spec.EnableUserSSHKeyAgent = ptr.To(true)
	cluster.Spec.ContainerRuntime = resources.ContainerRuntimeContainerd
	cluster.Spec.Cloud = initializeCloudProviderSpec(dc, provider)

	if err := defaulting.DefaultClusterSpec(ctx, &cluster.Spec, defaultClusterTemplate, seed, config, nil); err != nil {
		return nil, err
	}

	if cluster.Spec.Version.Semver() == nil && config.Spec.Versions.Default != nil {
		cluster.Spec.Version = *config.Spec.Versions.Default
	}

	return cluster, nil
}

func convertInternalDefaultClusterToExternal(internalCluster *kubermaticv1.Cluster) *apiv1.Cluster {
	return &apiv1.Cluster{
		Labels:          internalCluster.Labels,
		InheritedLabels: internalCluster.Status.InheritedLabels,
		Spec: apiv1.ClusterSpec{
			Cloud:                                internalCluster.Spec.Cloud,
			Version:                              internalCluster.Spec.Version,
			MachineNetworks:                      internalCluster.Spec.MachineNetworks,
			OIDC:                                 internalCluster.Spec.OIDC,
			UpdateWindow:                         internalCluster.Spec.UpdateWindow,
			AuditLogging:                         internalCluster.Spec.AuditLogging,
			UsePodSecurityPolicyAdmissionPlugin:  internalCluster.Spec.UsePodSecurityPolicyAdmissionPlugin,
			UsePodNodeSelectorAdmissionPlugin:    internalCluster.Spec.UsePodNodeSelectorAdmissionPlugin,
			UseEventRateLimitAdmissionPlugin:     internalCluster.Spec.UseEventRateLimitAdmissionPlugin,
			EnableUserSSHKeyAgent:                internalCluster.Spec.EnableUserSSHKeyAgent,
			EnableOperatingSystemManager:         internalCluster.Spec.EnableOperatingSystemManager,
			KubernetesDashboard:                  internalCluster.Spec.KubernetesDashboard,
			KubeLB:                               internalCluster.Spec.KubeLB,
			AdmissionPlugins:                     internalCluster.Spec.AdmissionPlugins,
			OPAIntegration:                       internalCluster.Spec.OPAIntegration,
			PodNodeSelectorAdmissionPluginConfig: internalCluster.Spec.PodNodeSelectorAdmissionPluginConfig,
			EventRateLimitConfig:                 internalCluster.Spec.EventRateLimitConfig,
			ServiceAccount:                       internalCluster.Spec.ServiceAccount,
			MLA:                                  internalCluster.Spec.MLA,
			ContainerRuntime:                     internalCluster.Spec.ContainerRuntime,
			ClusterNetwork:                       &internalCluster.Spec.ClusterNetwork,
			CNIPlugin:                            internalCluster.Spec.CNIPlugin,
			ExposeStrategy:                       internalCluster.Spec.ExposeStrategy,
			APIServerAllowedIPRanges:             internalCluster.Spec.APIServerAllowedIPRanges,
		},
		Type: apiv1.KubernetesClusterType,
	}
}

func initializeCloudProviderSpec(dc string, provider kubermaticv1.ProviderType) kubermaticv1.CloudSpec {
	cloudSpec := kubermaticv1.CloudSpec{
		DatacenterName: dc,
		ProviderName:   string(provider),
	}

	// We intentionally keep the cloud spec empty in the default cluster spec since it mostly depends on the cloud credentials.
	switch provider {
	case kubermaticv1.AWSCloudProvider:
		cloudSpec.AWS = &kubermaticv1.AWSCloudSpec{}
	case kubermaticv1.AzureCloudProvider:
		cloudSpec.Azure = &kubermaticv1.AzureCloudSpec{}
	case kubermaticv1.DigitaloceanCloudProvider:
		cloudSpec.Digitalocean = &kubermaticv1.DigitaloceanCloudSpec{}
	case kubermaticv1.GCPCloudProvider:
		cloudSpec.GCP = &kubermaticv1.GCPCloudSpec{}
	case kubermaticv1.HetznerCloudProvider:
		cloudSpec.Hetzner = &kubermaticv1.HetznerCloudSpec{}
	case kubermaticv1.OpenstackCloudProvider:
		cloudSpec.Openstack = &kubermaticv1.OpenstackCloudSpec{}
	case kubermaticv1.PacketCloudProvider:
		cloudSpec.Packet = &kubermaticv1.PacketCloudSpec{}
	case kubermaticv1.KubevirtCloudProvider:
		cloudSpec.Kubevirt = &kubermaticv1.KubevirtCloudSpec{}
	case kubermaticv1.VSphereCloudProvider:
		cloudSpec.VSphere = &kubermaticv1.VSphereCloudSpec{}
	case kubermaticv1.AlibabaCloudProvider:
		cloudSpec.Alibaba = &kubermaticv1.AlibabaCloudSpec{}
	case kubermaticv1.AnexiaCloudProvider:
		cloudSpec.Anexia = &kubermaticv1.AnexiaCloudSpec{}
	case kubermaticv1.NutanixCloudProvider:
		cloudSpec.Nutanix = &kubermaticv1.NutanixCloudSpec{}
	case kubermaticv1.VMwareCloudDirectorCloudProvider:
		cloudSpec.VMwareCloudDirector = &kubermaticv1.VMwareCloudDirectorCloudSpec{}
	}
	return cloudSpec
}
