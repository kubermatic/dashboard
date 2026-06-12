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

package cluster

import (
	"context"
	"crypto/x509"
	"errors"
	"fmt"
	"net/url"
	"strings"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	kubermaticv1helper "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1/helper"
	"k8c.io/kubermatic/v2/pkg/defaulting"
	"k8c.io/kubermatic/v2/pkg/features"
	"k8c.io/kubermatic/v2/pkg/provider"
	"k8c.io/kubermatic/v2/pkg/provider/cloud"

	"k8s.io/utils/ptr"
)

// Spec builds ClusterSpec kubermatic Custom Resource from API Cluster.
// The ClusterTemplate can be nil.
func Spec(ctx context.Context, apiCluster apiv1.Cluster, template *kubermaticv1.ClusterTemplate, seed *kubermaticv1.Seed, dc *kubermaticv1.Datacenter, config *kubermaticv1.KubermaticConfiguration, secretKeyGetter provider.SecretKeySelectorValueFunc, caBundle *x509.CertPool, features features.FeatureGate) (*kubermaticv1.ClusterSpec, provider.CloudProvider, error) {
	var userSSHKeysAgentEnabled = ptr.To(true)
	if apiCluster.Spec.EnableUserSSHKeyAgent != nil {
		userSSHKeysAgentEnabled = apiCluster.Spec.EnableUserSSHKeyAgent
	}

	// Enable kubernetes-dashboard by default
	var kubernetesDashboardEnabled = true
	if apiCluster.Spec.KubernetesDashboard != nil {
		kubernetesDashboardEnabled = apiCluster.Spec.KubernetesDashboard.Enabled
	}

	if apiCluster.Spec.EncryptionConfiguration != nil && apiCluster.Spec.EncryptionConfiguration.Enabled {
		features["encryptionAtRest"] = true
	} else {
		delete(features, "encryptionAtRest")
	}

	spec := &kubermaticv1.ClusterSpec{
		HumanReadableName:                   apiCluster.Name,
		Cloud:                               apiCluster.Spec.Cloud,
		MachineNetworks:                     apiCluster.Spec.MachineNetworks,
		OIDC:                                apiCluster.Spec.OIDC,
		UpdateWindow:                        apiCluster.Spec.UpdateWindow,
		Version:                             apiCluster.Spec.Version,
		UsePodSecurityPolicyAdmissionPlugin: apiCluster.Spec.UsePodSecurityPolicyAdmissionPlugin,
		UsePodNodeSelectorAdmissionPlugin:   apiCluster.Spec.UsePodNodeSelectorAdmissionPlugin,
		UseEventRateLimitAdmissionPlugin:    apiCluster.Spec.UseEventRateLimitAdmissionPlugin,
		EnableUserSSHKeyAgent:               userSSHKeysAgentEnabled,
		KubernetesDashboard: &kubermaticv1.KubernetesDashboard{
			Enabled: kubernetesDashboardEnabled,
		},
		AuditLogging:                         apiCluster.Spec.AuditLogging,
		AdmissionPlugins:                     apiCluster.Spec.AdmissionPlugins,
		OPAIntegration:                       apiCluster.Spec.OPAIntegration,
		PodNodeSelectorAdmissionPluginConfig: apiCluster.Spec.PodNodeSelectorAdmissionPluginConfig,
		EventRateLimitConfig:                 apiCluster.Spec.EventRateLimitConfig,
		ServiceAccount:                       apiCluster.Spec.ServiceAccount,
		MLA:                                  apiCluster.Spec.MLA,
		ContainerRuntime:                     apiCluster.Spec.ContainerRuntime,
		CNIPlugin:                            apiCluster.Spec.CNIPlugin,
		ExposeStrategy:                       apiCluster.Spec.ExposeStrategy,
		APIServerAllowedIPRanges:             apiCluster.Spec.APIServerAllowedIPRanges,
		KubeLB:                               apiCluster.Spec.KubeLB,
		DisableCSIDriver:                     apiCluster.Spec.DisableCSIDriver,
		Kyverno:                              apiCluster.Spec.Kyverno,
		EncryptionConfiguration:              apiCluster.Spec.EncryptionConfiguration,
		Features:                             features,
	}

	if apiCluster.Spec.ClusterNetwork != nil {
		spec.ClusterNetwork = *apiCluster.Spec.ClusterNetwork
	}

	// Map the per-cluster HTTP(S) proxy override into the operating-system-manager settings.
	// Empty values are intentionally left unset so the cluster inherits the datacenter/seed proxy.
	if co := apiCluster.Spec.ComponentsOverride; co != nil && co.OperatingSystemManager != nil && co.OperatingSystemManager.Proxy != nil {
		proxy := co.OperatingSystemManager.Proxy
		if err := ValidateProxySettings(proxy.HTTPProxy, proxy.NoProxy); err != nil {
			return nil, nil, err
		}
		osm := &kubermaticv1.OSMControllerSettings{}
		if proxy.HTTPProxy != "" {
			osm.Proxy.HTTPProxy = kubermaticv1.NewProxyValue(proxy.HTTPProxy)
		}
		if proxy.NoProxy != "" {
			osm.Proxy.NoProxy = kubermaticv1.NewProxyValue(proxy.NoProxy)
		}
		spec.ComponentsOverride.OperatingSystemManager = osm
	}

	// Default container runtime if it is empty.
	if spec.ContainerRuntime == "" {
		spec.ContainerRuntime = "containerd"
	}

	cloudProvider, err := CloudProviderForCluster(spec, dc, secretKeyGetter, caBundle)
	if err != nil {
		return nil, nil, err
	}

	if err := defaulting.DefaultClusterSpec(ctx, spec, nil, template, seed, config, cloudProvider); err != nil {
		return nil, nil, err
	}

	return spec, cloudProvider, nil
}

func CloudProviderForCluster(spec *kubermaticv1.ClusterSpec, dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc, caBundle *x509.CertPool) (provider.CloudProvider, error) {
	providerName, err := kubermaticv1helper.ClusterCloudProviderName(spec.Cloud)
	if err != nil {
		return nil, fmt.Errorf("invalid cloud spec: %w", err)
	}
	if providerName == "" {
		return nil, errors.New("cluster has no cloud provider")
	}

	return cloud.Provider(dc, secretKeyGetter, caBundle)
}

// ValidateProxySettings validates the per-cluster HTTP(S) proxy override.
// httpProxy must be an http:// or https:// URL with a host. noProxy must be a
// comma-separated list of non-empty entries without scheme or whitespace.
// Empty values are valid (the cluster then inherits the datacenter/seed proxy).
func ValidateProxySettings(httpProxy, noProxy string) error {
	if httpProxy != "" {
		u, err := url.Parse(httpProxy)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			return fmt.Errorf("invalid httpProxy %q: must be an http:// or https:// URL", httpProxy)
		}
	}

	if noProxy != "" {
		for token := range strings.SplitSeq(noProxy, ",") {
			entry := strings.TrimSpace(token)
			if entry == "" {
				return errors.New("invalid noProxy: contains an empty entry")
			}
			if strings.ContainsAny(entry, " \t") || strings.Contains(entry, "://") {
				return fmt.Errorf("invalid noProxy entry %q: must be a host, domain, IP or CIDR", entry)
			}
		}
	}

	return nil
}
