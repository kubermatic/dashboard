/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package kubernetes

import (
	"context"
	"fmt"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type UserClusterConfigProvider struct {
	createMasterImpersonatedClient ImpersonationClient
	privilegedClient               ctrlruntimeclient.Client
}

var _ provider.UserClusterConfigProvider = &UserClusterConfigProvider{}

func NewUserClusterConfigProvider(createMasterImpersonatedClient ImpersonationClient, privilegedClient ctrlruntimeclient.Client) *UserClusterConfigProvider {
	return &UserClusterConfigProvider{
		createMasterImpersonatedClient: createMasterImpersonatedClient,
		privilegedClient:               privilegedClient,
	}
}

func (cp *UserClusterConfigProvider) GetAdmissionPluginsConfiguration(ctx context.Context) (*kubermaticv1.AdmissionPluginsConfiguration, error) {
	config := kubermaticv1.KubermaticConfigurationList{}
	nameSpace := resources.KubermaticNamespace
	if err := cp.privilegedClient.List(ctx, &config, &ctrlruntimeclient.ListOptions{Namespace: nameSpace}); err != nil {
		return nil, fmt.Errorf("failed to list KubermaticConfigurations in namespace %q: %w", nameSpace, err)
	}
	return config.Items[0].Spec.UserCluster.AdmissionPlugins, nil
}

func (cp *UserClusterConfigProvider) UpdateAdmissionPluginsConfiguration(ctx context.Context, userInfo *provider.UserInfo, plugins apiv2.AdmissionPluginsConfiguration) (*kubermaticv1.AdmissionPluginsConfiguration, error) {
	client, err := createImpersonationClientWrapperFromUserInfo(userInfo, cp.createMasterImpersonatedClient)
	if err != nil {
		return nil, fmt.Errorf("failed to create impersonated client: %w", err)
	}
	if userInfo.IsAdmin {
		client = cp.privilegedClient
	}
	config := kubermaticv1.KubermaticConfigurationList{}
	nameSpace := resources.KubermaticNamespace
	if err := client.List(ctx, &config, &ctrlruntimeclient.ListOptions{Namespace: nameSpace}); err != nil {
		return nil, fmt.Errorf("failed to list KubermaticConfigurations in namespace %q: %w", nameSpace, err)
	}

	existingConfig := &config.Items[0]
	existingConfig.Spec.UserCluster.AdmissionPlugins = &kubermaticv1.AdmissionPluginsConfiguration{
		EventRateLimit: &kubermaticv1.EventRateLimitPluginConfiguration{
			Enabled:       plugins.EventRateLimit.Enabled,
			Enforced:      plugins.EventRateLimit.Enforced,
			DefaultConfig: plugins.EventRateLimit.DefaultConfig,
		},
	}
	if err := cp.privilegedClient.Update(ctx, existingConfig); err != nil {
		return nil, fmt.Errorf("failed to update AdmissionPluginsConfiguration in KubermaticConfiguration %q: %w", existingConfig.Name, err)
	}
	return existingConfig.Spec.UserCluster.AdmissionPlugins, nil
}
