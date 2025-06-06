//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2020 Kubermatic GmbH

   1.	You may only view, read and display for studying purposes the source
      code of the software licensed under this license, and, to the extent
      explicitly provided under this license, the binary code.
   2.	Any use of the software which exceeds the foregoing right, including,
      without limitation, its execution, compilation, copying, modification
      and distribution, is expressly prohibited.
   3.	THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   END OF TERMS AND CONDITIONS
*/

package kubermaticapi

import (
	"context"

	backupstorage "k8c.io/dashboard/v2/pkg/ee/clusterbackup/storage-location"
	groupprojectbinding "k8c.io/dashboard/v2/pkg/ee/group-project-binding/provider"
	policybinding "k8c.io/dashboard/v2/pkg/ee/kyverno/policy-binding"
	policytemplate "k8c.io/dashboard/v2/pkg/ee/kyverno/policy-template"
	eeprovider "k8c.io/dashboard/v2/pkg/ee/provider"
	resourcequotas "k8c.io/dashboard/v2/pkg/ee/resource-quota"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func SeedsGetterFactory(ctx context.Context, client ctrlruntimeclient.Client, namespace string) (provider.SeedsGetter, error) {
	return eeprovider.SeedsGetterFactory(ctx, client, namespace)
}

func SeedKubeconfigGetterFactory(ctx context.Context, client ctrlruntimeclient.Client) (provider.SeedKubeconfigGetter, error) {
	return kubernetes.SeedKubeconfigGetterFactory(ctx, client)
}

func ResourceQuotaProviderFactory(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) provider.ResourceQuotaProvider {
	return resourcequotas.NewResourceQuotaProvider(createMasterImpersonatedClient, privilegedClient)
}

func GroupProjectBindingProviderFactory(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) provider.GroupProjectBindingProvider {
	return groupprojectbinding.NewGroupProjectBindingProvider(createMasterImpersonatedClient, privilegedClient)
}

func BackupStorageProviderFactory(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) provider.BackupStorageProvider {
	return backupstorage.NewBackupStorageProvider(createMasterImpersonatedClient, privilegedClient)
}

func PolicyTemplateProviderFactory(privilegedClient ctrlruntimeclient.Client) provider.PolicyTemplateProvider {
	return policytemplate.NewPolicyTemplateProvider(privilegedClient)
}

func PolicyBindingProviderFactory(privilegedClient ctrlruntimeclient.Client) provider.PolicyBindingProvider {
	return policybinding.NewPolicyBindingProvider(privilegedClient)
}
