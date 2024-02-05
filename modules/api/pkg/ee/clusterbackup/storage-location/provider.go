//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2024 Kubermatic GmbH

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

package storagelocation

import (
	"context"
	"fmt"

	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/types"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type BackupStorageProvider struct {
	// createMasterImpersonatedClient is used as a ground for impersonation
	// whenever a connection to Seed API server is required
	createMasterImpersonatedClient kubernetes.ImpersonationClient
	privilegedClient               ctrlruntimeclient.Client
}

var _ provider.BackupStorageProvider = &BackupStorageProvider{}

func NewBackupStorageProvider(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) *BackupStorageProvider {
	return &BackupStorageProvider{
		createMasterImpersonatedClient: createMasterImpersonatedClient,
		privilegedClient:               privilegedClient,
	}
}

func (p *BackupStorageProvider) ListUnsecured(ctx context.Context, labelSet map[string]string) (*kubermaticv1.ClusterBackupStorageLocationList, error) {
	listOpts := &ctrlruntimeclient.ListOptions{
		LabelSelector: labels.SelectorFromSet(labelSet),
		Namespace:     resources.KubermaticNamespace,
	}

	cbslList := &kubermaticv1.ClusterBackupStorageLocationList{}
	if err := p.privilegedClient.List(ctx, cbslList, listOpts); err != nil {
		return nil, fmt.Errorf("failed to list ClusterBackupStorageLocations: %w", err)
	}
	return cbslList, nil
}

// func (p *BackupStorageProvider) Get(ctx context.Context, userInfo *provider.UserInfo, name string) (*kubermaticv1.ClusterBackupStorageLocation, error)
func (p *BackupStorageProvider) GetUnsecured(ctx context.Context, name string, labelSet map[string]string) (*kubermaticv1.ClusterBackupStorageLocation, error) {
	// we use List() to filter CBSLs with labels easily, to keep scoped into the owner project.
	cbslList, err := p.ListUnsecured(ctx, labelSet)
	if err != nil {
		return nil, fmt.Errorf("failed to list ClusterBackupStorageLocations: %w", err)
	}
	for _, cbsl := range cbslList.Items {
		if cbsl.Name == name {
			return &cbsl, nil
		}
	}
	return nil, nil
}

func (p *BackupStorageProvider) CreateUnsecured(ctx context.Context, cbsl *kubermaticv1.ClusterBackupStorageLocation) (*kubermaticv1.ClusterBackupStorageLocation, error) {
	return cbsl, p.privilegedClient.Create(ctx, cbsl)
}

func (p *BackupStorageProvider) CreateCredentialsUnsecured(ctx context.Context, credentials *corev1.Secret) error {
	return p.privilegedClient.Create(ctx, credentials)
}

func (p *BackupStorageProvider) UpdateCredentialsUnsecured(ctx context.Context, credentials *corev1.Secret) error {
	existing := &corev1.Secret{}
	if err := p.privilegedClient.Get(ctx, types.NamespacedName{Name: credentials.Name, Namespace: resources.KubermaticNamespace}, existing); err != nil {
		return err
	}
	existing.Data = credentials.Data
	return p.privilegedClient.Update(ctx, existing)
}

func (p *BackupStorageProvider) DeleteUnsecured(ctx context.Context, name string) error {
	cbsl := &kubermaticv1.ClusterBackupStorageLocation{}
	if err := p.privilegedClient.Get(ctx, types.NamespacedName{Name: name, Namespace: resources.KubermaticNamespace}, cbsl); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return err
	}

	secretName := cbsl.Spec.Credential.Name
	secret := &corev1.Secret{}
	if err := p.privilegedClient.Get(ctx, types.NamespacedName{Name: secretName, Namespace: resources.KubermaticNamespace}, secret); err != nil && !apierrors.IsNotFound(err) {
		return err
	}
	if secret != nil {
		if err := p.privilegedClient.Delete(ctx, secret); err != nil && !apierrors.IsNotFound(err) {
			return err
		}
	}
	return p.privilegedClient.Delete(ctx, cbsl)
}

func (p *BackupStorageProvider) UpdateUnsecured(ctx context.Context, cbsl *kubermaticv1.ClusterBackupStorageLocation) (*kubermaticv1.ClusterBackupStorageLocation, error) {
	existing := &kubermaticv1.ClusterBackupStorageLocation{}
	if err := p.privilegedClient.Get(ctx, types.NamespacedName{Name: cbsl.Name, Namespace: resources.KubermaticNamespace}, existing); err != nil {
		return nil, err
	}
	existing.Spec = *cbsl.Spec.DeepCopy()
	return existing, p.privilegedClient.Update(ctx, existing)
}
