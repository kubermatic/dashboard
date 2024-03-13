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
	"errors"
	"fmt"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apiserver/pkg/storage/names"
	restclient "k8s.io/client-go/rest"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type BackupStorageProvider struct {
	createMasterImpersonatedClient kubernetes.ImpersonationClient
	privilegedClient               ctrlruntimeclient.Client
}

var _ provider.BackupStorageProvider = &BackupStorageProvider{}

const (
	ownerReferenceApi  = "kubermatic.k8s.io/v1"
	ownerReferenceKind = "ClusterBackupStorageLocation"
)

func NewBackupStorageProvider(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) *BackupStorageProvider {
	return &BackupStorageProvider{
		createMasterImpersonatedClient: createMasterImpersonatedClient,
		privilegedClient:               privilegedClient,
	}
}

func (p *BackupStorageProvider) List(ctx context.Context, userInfo *provider.UserInfo, labelSet map[string]string) (*kubermaticv1.ClusterBackupStorageLocationList, error) {
	if userInfo == nil {
		return nil, errors.New("a user is missing but required")
	}

	listOpts := &ctrlruntimeclient.ListOptions{
		LabelSelector: labels.SelectorFromSet(labelSet),
		Namespace:     resources.KubermaticNamespace,
	}

	cbslList := &kubermaticv1.ClusterBackupStorageLocationList{}
	client := p.privilegedClient

	if err := client.List(ctx, cbslList, listOpts); err != nil {
		return nil, fmt.Errorf("failed to list ClusterBackupStorageLocations: %w", err)
	}
	return cbslList, nil
}

func (p *BackupStorageProvider) Get(ctx context.Context, userInfo *provider.UserInfo, name string, labelSet map[string]string) (*kubermaticv1.ClusterBackupStorageLocation, error) {
	if userInfo == nil {
		return nil, errors.New("a user is missing but required")
	}

	cbslList, err := p.List(ctx, userInfo, labelSet)
	if err != nil {
		return nil, err
	}
	for _, cbsl := range cbslList.Items {
		if cbsl.Name == name {
			return &cbsl, nil
		}
	}
	return nil, nil
}

func (p *BackupStorageProvider) Create(ctx context.Context, userInfo *provider.UserInfo, cbslName, projectID string, cbsl *kubermaticv1.ClusterBackupStorageLocation, credentials apiv2.S3BackupCredentials) (*kubermaticv1.ClusterBackupStorageLocation, error) {
	if userInfo == nil {
		return nil, errors.New("a user is missing but required")
	}
	cbslFullName := fmt.Sprintf("%s-%s", cbslName, projectID)
	secretName := fmt.Sprintf("credential-%s-", cbslFullName)

	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      names.SimpleNameGenerator.GenerateName(secretName),
			Namespace: resources.KubermaticNamespace,
			Labels:    getCSBLLabels(cbslName, projectID),
		},
		Data: map[string][]byte{
			"accessKeyId":     []byte(credentials.AccessKeyID),
			"secretAccessKey": []byte(credentials.SecretAccessKey),
		},
	}
	client := p.privilegedClient

	if !userInfo.IsAdmin {
		var err error
		client, err = p.getImpersonatedClient(userInfo)
		if err != nil {
			return nil, err
		}
	}

	cbsl.ObjectMeta = metav1.ObjectMeta{
		Name:      cbslFullName,
		Namespace: resources.KubermaticNamespace,
		Labels:    getCSBLLabels(cbslName, projectID),
	}
	cbsl.Spec.Credential = &corev1.SecretKeySelector{
		LocalObjectReference: corev1.LocalObjectReference{
			Name: secret.Name,
		},
		Key: "cloud-credentials",
	}
	if err := client.Create(ctx, cbsl); err != nil {
		return nil, err
	}
	ownerReference := metav1.OwnerReference{
		APIVersion: ownerReferenceApi,
		Kind:       ownerReferenceKind,
		Name:       cbslFullName,
		UID:        cbsl.UID,
	}

	secret.ObjectMeta.OwnerReferences = append(secret.ObjectMeta.OwnerReferences, ownerReference)

	if err := p.privilegedClient.Create(ctx, secret); err != nil {
		return nil, err
	}
	return cbsl, nil
}

func (p *BackupStorageProvider) Delete(ctx context.Context, userInfo *provider.UserInfo, name string) error {
	if userInfo == nil {
		return errors.New("a user is missing but required")
	}

	client := p.privilegedClient

	cbsl := &kubermaticv1.ClusterBackupStorageLocation{}
	if err := client.Get(ctx, types.NamespacedName{Name: name, Namespace: resources.KubermaticNamespace}, cbsl); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return err
	}

	if !userInfo.IsAdmin {
		var err error
		client, err = p.getImpersonatedClient(userInfo)
		if err != nil {
			return err
		}
	}

	if err := client.Delete(ctx, cbsl); err != nil {
		return err
	}

	if cbsl.Spec.Credential != nil {
		secretName := cbsl.Spec.Credential.Name
		if err := p.deleteCredentials(ctx, secretName); err != nil {
			return err
		}
	}
	return nil
}

func (p *BackupStorageProvider) deleteCredentials(ctx context.Context, secretName string) error {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: resources.KubermaticNamespace,
		},
	}
	if err := p.privilegedClient.Delete(ctx, secret); err != nil && !apierrors.IsNotFound(err) {
		return err
	}
	return nil
}

func (p *BackupStorageProvider) Patch(ctx context.Context, userInfo *provider.UserInfo, cbslName string, cbsl *kubermaticv1.ClusterBackupStorageLocation, updatedCreds apiv2.S3BackupCredentials) (*kubermaticv1.ClusterBackupStorageLocation, error) {
	if userInfo == nil {
		return nil, errors.New("a user is missing but required")
	}

	client := p.privilegedClient

	existing := &kubermaticv1.ClusterBackupStorageLocation{}
	if err := client.Get(ctx, types.NamespacedName{Name: cbslName, Namespace: resources.KubermaticNamespace}, existing); err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		var err error
		client, err = p.getImpersonatedClient(userInfo)
		if err != nil {
			return nil, err
		}
	}

	if existing.Spec.Credential != nil && existing.Spec.Credential.Name == "" {
		return nil, fmt.Errorf("ClusterBackupStorageLocation must have a credentials secret name set")
	}

	secretName := existing.Spec.Credential.Name
	updated := existing.DeepCopy()
	updated.Spec = *cbsl.Spec.DeepCopy()

	// The UI doesn't know about the secret, because we ask the user for credentials directly. So we have to reassign it again.
	updated.Spec.Credential = &corev1.SecretKeySelector{
		LocalObjectReference: corev1.LocalObjectReference{
			Name: secretName,
		},
		Key: "cloud-credentials",
	}
	if err := client.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing)); err != nil {
		return nil, err
	}

	if err := p.patchCredentials(ctx, secretName, updatedCreds); err != nil {
		return nil, err
	}
	return updated, nil
}

func (p *BackupStorageProvider) patchCredentials(ctx context.Context, secretName string, credentials apiv2.S3BackupCredentials) error {
	// if we get empty credentials than we don't need to update the secret
	if credentials.AccessKeyID == "" || credentials.SecretAccessKey == "" {
		return nil
	}

	existing := &corev1.Secret{}
	if err := p.privilegedClient.Get(ctx, types.NamespacedName{Name: secretName, Namespace: resources.KubermaticNamespace}, existing); err != nil {
		return err
	}
	// same credentials
	if credentials.AccessKeyID == string(existing.Data["accessKeyId"]) &&
		credentials.SecretAccessKey == string(existing.Data["secretAccessKey"]) {
		return nil
	}

	updated := existing.DeepCopy()
	updated.Data = map[string][]byte{
		"accessKeyId":     []byte(credentials.AccessKeyID),
		"secretAccessKey": []byte(credentials.SecretAccessKey),
	}
	return p.privilegedClient.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing))
}

func (p *BackupStorageProvider) getImpersonatedClient(userInfo *provider.UserInfo) (ctrlruntimeclient.Client, error) {
	if userInfo == nil {
		return nil, errors.New("a user is missing but required")
	}
	impersonationCfg := restclient.ImpersonationConfig{
		UserName: userInfo.Email,
		Groups:   userInfo.Groups,
	}
	return p.createMasterImpersonatedClient(impersonationCfg)
}
