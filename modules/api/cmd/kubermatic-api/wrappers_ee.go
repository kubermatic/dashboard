//go:build ee

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

package main

import (
	"context"
	"flag"

	eeapi "k8c.io/dashboard/v2/pkg/ee/cmd/kubermatic-api"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func addFlags(fs *flag.FlagSet) {
	// NOP
}

func seedsGetterFactory(ctx context.Context, client ctrlruntimeclient.Client, opt serverRunOptions) (provider.SeedsGetter, error) {
	return eeapi.SeedsGetterFactory(ctx, client, opt.namespace)
}

func seedKubeconfigGetterFactory(ctx context.Context, client ctrlruntimeclient.Client, opt serverRunOptions) (provider.SeedKubeconfigGetter, error) {
	return eeapi.SeedKubeconfigGetterFactory(ctx, client)
}

func resourceQuotaProviderFactory(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) provider.ResourceQuotaProvider {
	return eeapi.ResourceQuotaProviderFactory(createMasterImpersonatedClient, privilegedClient)
}

func groupProjectBindingFactory(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) provider.GroupProjectBindingProvider {
	return eeapi.GroupProjectBindingProviderFactory(createMasterImpersonatedClient, privilegedClient)
}

func backupStorageProviderFactory(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) provider.BackupStorageProvider {
	return eeapi.BackupStorageProviderFactory(createMasterImpersonatedClient, privilegedClient)
}

func policyTemplateProviderFactory(privilegedClient ctrlruntimeclient.Client) provider.PolicyTemplateProvider {
	return eeapi.PolicyTemplateProviderFactory(privilegedClient)
}

func policyBindingProviderFactory(privilegedClient ctrlruntimeclient.Client) provider.PolicyBindingProvider {
	return eeapi.PolicyBindingProviderFactory(privilegedClient)
}
