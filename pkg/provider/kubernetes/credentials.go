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

package kubernetes

import (
	"context"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"strconv"

	providerconfig "github.com/kubermatic/machine-controller/pkg/providerconfig/types"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	awsprovider "k8c.io/dashboard/v2/pkg/provider/cloud/aws"
	"k8c.io/dashboard/v2/pkg/provider/cloud/azure"
	"k8c.io/dashboard/v2/pkg/provider/cloud/digitalocean"
	"k8c.io/dashboard/v2/pkg/provider/cloud/gcp"
	"k8c.io/dashboard/v2/pkg/provider/cloud/hetzner"
	"k8c.io/dashboard/v2/pkg/provider/cloud/packet"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	"k8c.io/kubermatic/v2/pkg/resources/reconciling"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type ValidateCredentials struct {
	Datacenter *kubermaticv1.Datacenter
	CABundle   *x509.CertPool
}

func credentialSecretCreatorGetter(secretName string, clusterLabels map[string]string, secretData map[string][]byte) (reconciling.NamedSecretCreatorGetter, error) {
	projectID := clusterLabels[kubermaticv1.ProjectIDLabelKey]
	if len(projectID) == 0 {
		return nil, fmt.Errorf("cluster is missing '%s' label", kubermaticv1.ProjectIDLabelKey)
	}

	return func() (name string, create reconciling.SecretCreator) {
		return secretName, func(existing *corev1.Secret) (*corev1.Secret, error) {
			if existing.Labels == nil {
				existing.Labels = map[string]string{}
			}

			existing.Labels[kubermaticv1.ProjectIDLabelKey] = projectID
			existing.Data = secretData

			return existing, nil
		}
	}, nil
}

func GetKubeOneNamespaceName(externalClusterName string) string {
	return fmt.Sprintf("%s%s", resources.KubeOneNamespacePrefix, externalClusterName)
}

func (p *ExternalClusterProvider) CreateKubeOneClusterNamespace(ctx context.Context, externalCluster *kubermaticv1.ExternalCluster) error {
	kubeOneNamespace := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: GetKubeOneNamespaceName(externalCluster.Name),
		},
	}
	if err := p.GetMasterClient().Create(ctx, kubeOneNamespace); err != nil {
		return fmt.Errorf("failed to create kubeone cluster namespace: %w", err)
	}

	return nil
}

func ensureCredentialKubeOneSecret(ctx context.Context, masterClient ctrlruntimeclient.Client, externalcluster *kubermaticv1.ExternalCluster, secretName string, secretData map[string][]byte) (*providerconfig.GlobalSecretKeySelector, error) {
	creator, err := credentialSecretCreatorGetter(secretName, externalcluster.Labels, secretData)
	if err != nil {
		return nil, err
	}

	kubeOneNamespaceName := GetKubeOneNamespaceName(externalcluster.Name)
	creators := []reconciling.NamedSecretCreatorGetter{creator}

	if err := reconciling.ReconcileSecrets(ctx, creators, kubeOneNamespaceName, masterClient); err != nil {
		return nil, err
	}

	return &providerconfig.GlobalSecretKeySelector{
		ObjectReference: corev1.ObjectReference{
			Name:      secretName,
			Namespace: kubeOneNamespaceName,
		},
	}, nil
}

// CreateOrUpdateKubeOneCredentialSecret creates a new secret for a credential.
func (p *ExternalClusterProvider) CreateOrUpdateKubeOneCredentialSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, externalCluster *kubermaticv1.ExternalCluster) error {
	secretName := GetKubeOneCredentialsSecretName(cloud)

	if cloud.AWS != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneAWS
		return createOrUpdateKubeOneAWSSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.GCP != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneGCP
		return createOrUpdateKubeOneGCPSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.Azure != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneAzure
		return createOrUpdateKubeOneAzureSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.DigitalOcean != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneDigitalOcean
		return createOrUpdateKubeOneDigitaloceanSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.VSphere != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneVSphere
		return createOrUpdateKubeOneVSphereSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.Hetzner != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneHetzner
		return createOrUpdateKubeOneHetznerSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.Equinix != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneEquinix
		return createOrUpdateKubeOneEquinixSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.OpenStack != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneOpenStack
		return createOrUpdateKubeOneOpenstackSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.Nutanix != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneNutanix
		return createOrUpdateKubeOneNutanixSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	if cloud.VMwareCloudDirector != nil {
		externalCluster.Spec.CloudSpec.KubeOne.ProviderName = resources.KubeOneVMwareCloudDirector
		return createOrUpdateKubeOneVMwareCloudDirectorSecret(ctx, cloud, p.GetMasterClient(), secretName, externalCluster)
	}
	return nil
}

func createOrUpdateKubeOneAWSSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalcluster *kubermaticv1.ExternalCluster) error {
	if cloud.AWS.AccessKeyID == "" || cloud.AWS.SecretAccessKey == "" {
		return utilerrors.NewBadRequest("kubeone aws credentials missing")
	}

	if err := awsprovider.ValidateCredentials(ctx, cloud.AWS.AccessKeyID, cloud.AWS.SecretAccessKey); err != nil {
		return fmt.Errorf("invalid AWS credentials: %w", err)
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalcluster, secretName, map[string][]byte{
		resources.AWSAccessKeyID:     []byte(cloud.AWS.AccessKeyID),
		resources.AWSSecretAccessKey: []byte(cloud.AWS.SecretAccessKey),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to externalCluster object
	externalcluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneGCPSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	encodedServiceAccount := cloud.GCP.ServiceAccount
	if encodedServiceAccount == "" {
		return utilerrors.NewBadRequest("kubeone gcp credentials missing")
	}

	if err := gcp.ValidateCredentials(ctx, encodedServiceAccount); err != nil {
		return fmt.Errorf("invalid GCP credentials: %w", err)
	}

	serviceAccount, err := base64.StdEncoding.DecodeString(encodedServiceAccount)
	if err != nil {
		return fmt.Errorf("failed to decode gcp credential: %w", err)
	}
	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.GCPServiceAccount: serviceAccount,
	})
	if err != nil {
		return err
	}

	// add secret key selectors to cluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneAzureSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	tenantID := cloud.Azure.TenantID
	subscriptionID := cloud.Azure.SubscriptionID
	clientID := cloud.Azure.ClientID
	clientSecret := cloud.Azure.ClientSecret

	if tenantID == "" || subscriptionID == "" || clientID == "" || clientSecret == "" {
		return utilerrors.NewBadRequest("kubeone Azure credentials missing")
	}

	cred, err := azure.Credentials{
		TenantID:       tenantID,
		SubscriptionID: subscriptionID,
		ClientID:       clientID,
		ClientSecret:   clientSecret,
	}.ToAzureCredential()
	if err != nil {
		return fmt.Errorf("invalid Azure credentials: %w", err)
	}

	if err := azure.ValidateCredentials(ctx, cred, subscriptionID); err != nil {
		return fmt.Errorf("invalid Azure credentials: %w", err)
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.AzureTenantID:       []byte(tenantID),
		resources.AzureSubscriptionID: []byte(subscriptionID),
		resources.AzureClientID:       []byte(clientID),
		resources.AzureClientSecret:   []byte(clientSecret),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to externalCluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneDigitaloceanSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	token := cloud.DigitalOcean.Token

	if token == "" {
		return utilerrors.NewBadRequest("kubeone DigitalOcean credentials missing")
	}

	if err := digitalocean.ValidateCredentials(ctx, token); err != nil {
		return fmt.Errorf("invalid DigitalOcean token: %w", err)
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.DigitaloceanToken: []byte(token),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to externalCluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneOpenstackSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	authUrl := cloud.OpenStack.AuthURL
	username := cloud.OpenStack.Username
	password := cloud.OpenStack.Password
	project := cloud.OpenStack.Project
	projectID := cloud.OpenStack.ProjectID
	domain := cloud.OpenStack.Domain
	region := cloud.OpenStack.Region

	if username == "" || password == "" || domain == "" || authUrl == "" || project == "" || projectID == "" || region == "" {
		return utilerrors.NewBadRequest("kubeone Openstack credentials missing")
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.OpenstackAuthURL:   []byte(authUrl),
		resources.OpenstackUsername:  []byte(username),
		resources.OpenstackPassword:  []byte(password),
		resources.OpenstackProject:   []byte(project),
		resources.OpenstackProjectID: []byte(projectID),
		resources.OpenstackDomain:    []byte(domain),
		resources.OpenstackRegion:    []byte(region),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to externalCluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneVSphereSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	username := cloud.VSphere.Username
	password := cloud.VSphere.Password
	server := cloud.VSphere.Server

	if username == "" || password == "" || server == "" {
		return utilerrors.NewBadRequest("kubeone VSphere credentials missing")
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.VsphereUsername: []byte(username),
		resources.VspherePassword: []byte(password),
		resources.VsphereServer:   []byte(server),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to externalCluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneEquinixSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	apiKey := cloud.Equinix.APIKey
	projectID := cloud.Equinix.ProjectID

	if apiKey == "" || projectID == "" {
		return utilerrors.NewBadRequest("kubeone Packet credentials missing")
	}

	if err := packet.ValidateCredentials(apiKey, projectID); err != nil {
		return fmt.Errorf("invalid Packet credentials: %w", err)
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.PacketAPIKey:    []byte(apiKey),
		resources.PacketProjectID: []byte(projectID),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to cluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneHetznerSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	token := cloud.Hetzner.Token

	if token == "" {
		return utilerrors.NewBadRequest("kubeone Hetzner credentials missing")
	}

	if err := hetzner.ValidateCredentials(ctx, token); err != nil {
		return fmt.Errorf("invalid Hetzner credentials: %w", err)
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.HetznerToken: []byte(token),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to cluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneNutanixSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	username := cloud.Nutanix.Username
	password := cloud.Nutanix.Password
	endpoint := cloud.Nutanix.Endpoint
	port := cloud.Nutanix.Port
	peEndpoint := cloud.Nutanix.PrismElementEndpoint
	peUsername := cloud.Nutanix.PrismElementUsername
	pePassword := cloud.Nutanix.PrismElementPassword
	proxyURL := cloud.Nutanix.ProxyURL
	clusterName := cloud.Nutanix.ClusterName
	allowInsecure := cloud.Nutanix.AllowInsecure

	if endpoint == "" || port == "" || username == "" || password == "" || peEndpoint == "" || peUsername == "" || pePassword == "" {
		return utilerrors.NewBadRequest("kubeone Nutanix credentials missing")
	}

	secretData := map[string][]byte{
		resources.NutanixUsername:    []byte(username),
		resources.NutanixPassword:    []byte(password),
		resources.NutanixEndpoint:    []byte(endpoint),
		resources.NutanixPort:        []byte(port),
		resources.NutanixCSIUsername: []byte(peUsername),
		resources.NutanixCSIPassword: []byte(pePassword),
		resources.NutanixCSIEndpoint: []byte(peEndpoint),
	}

	if proxyURL != "" {
		secretData[resources.NutanixProxyURL] = []byte(proxyURL)
	}
	if allowInsecure {
		secretData[resources.NutanixAllowInsecure] = []byte(strconv.FormatBool(allowInsecure))
	}
	if clusterName != "" {
		secretData[resources.NutanixClusterName] = []byte(clusterName)
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, secretData)
	if err != nil {
		return err
	}

	// add secret key selectors to cluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef

	return nil
}

func createOrUpdateKubeOneVMwareCloudDirectorSecret(ctx context.Context, cloud apiv2.KubeOneCloudSpec, masterClient ctrlruntimeclient.Client, secretName string, externalCluster *kubermaticv1.ExternalCluster) error {
	username := cloud.VMwareCloudDirector.Username
	password := cloud.VMwareCloudDirector.Password
	url := cloud.VMwareCloudDirector.URL
	organization := cloud.VMwareCloudDirector.Organization
	vdc := cloud.VMwareCloudDirector.VDC

	if username == "" || password == "" || url == "" || organization == "" || vdc == "" {
		return utilerrors.NewBadRequest("kubeone VMware Cloud Director credentials missing")
	}

	// move credentials into dedicated Secret
	credentialRef, err := ensureCredentialKubeOneSecret(ctx, masterClient, externalCluster, secretName, map[string][]byte{
		resources.VMwareCloudDirectorUsername:     []byte(username),
		resources.VMwareCloudDirectorPassword:     []byte(password),
		resources.VMwareCloudDirectorOrganization: []byte(organization),
		resources.VMwareCloudDirectorVDC:          []byte(vdc),
		resources.VMwareCloudDirectorURL:          []byte(url),
	})
	if err != nil {
		return err
	}

	// add secret key selectors to externalCluster object
	externalCluster.Spec.CloudSpec.KubeOne.CredentialsReference = *credentialRef
	return nil
}
func GetKubeOneCredentialsSecretName(cloud apiv2.KubeOneCloudSpec) string {
	if cloud.AWS != nil {
		return "credential-aws"
	}
	if cloud.Azure != nil {
		return "credential-azure"
	}
	if cloud.DigitalOcean != nil {
		return "credential-digitalocean"
	}
	if cloud.GCP != nil {
		return "credential-gcp"
	}
	if cloud.Hetzner != nil {
		return "credential-hetzner"
	}
	if cloud.OpenStack != nil {
		return "credential-openstack"
	}
	if cloud.Equinix != nil {
		return "credential-equinix"
	}
	if cloud.VMwareCloudDirector != nil {
		return "credential-vmware-cloud-director"
	}
	if cloud.VSphere != nil {
		return "credential-vsphere"
	}
	if cloud.Nutanix != nil {
		return "credential-nutanix"
	}
	return ""
}
