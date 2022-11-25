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

package kubevirt

import (
	"context"
	"encoding/base64"
	"errors"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	"k8s.io/client-go/tools/clientcmd"
)

const (
	// FinalizerNamespace will ensure the deletion of the dedicated namespace.
	FinalizerNamespace = "kubermatic.k8c.io/cleanup-kubevirt-namespace"
)

type kubevirt struct {
	secretKeySelector provider.SecretKeySelectorValueFunc
}

func NewCloudProvider(secretKeyGetter provider.SecretKeySelectorValueFunc) provider.CloudProvider {
	return &kubevirt{
		secretKeySelector: secretKeyGetter,
	}
}

var _ provider.CloudProvider = &kubevirt{}

func (k *kubevirt) DefaultCloudSpec(ctx context.Context, spec *kubermaticv1.CloudSpec) error {
	if spec.Kubevirt == nil {
		return errors.New("KubeVirt cloud provider spec is empty")
	}

	client, err := k.GetClientForCluster(*spec)
	if err != nil {
		return err
	}

	return updateInfraStorageClassesInfo(ctx, client, spec)
}

func (k *kubevirt) ValidateCloudSpec(ctx context.Context, spec kubermaticv1.CloudSpec) error {
	kubeconfig, err := GetCredentialsForCluster(spec, k.secretKeySelector)
	if err != nil {
		return err
	}

	config, err := base64.StdEncoding.DecodeString(kubeconfig)
	if err != nil {
		// if the decoding failed, the kubeconfig is sent already decoded without the need of decoding it,
		// for example the value has been read from Vault during the ci tests, which is saved as json format.
		config = []byte(kubeconfig)
	}

	_, err = clientcmd.RESTConfigFromKubeConfig(config)
	if err != nil {
		return err
	}

	// TODO: (mfranczy) this has to be changed
	// it is wrong to mutate the value of kubeconfig in the validation method
	spec.Kubevirt.Kubeconfig = string(config)

	return nil
}

func (k *kubevirt) ValidateCloudSpecUpdate(ctx context.Context, oldSpec kubermaticv1.CloudSpec, newSpec kubermaticv1.CloudSpec) error {
	return nil
}

// GetClientForCluster returns the kubernetes client the KubeVirt underlying cluster.
func (k *kubevirt) GetClientForCluster(spec kubermaticv1.CloudSpec) (*Client, error) {
	kubeconfig, err := GetCredentialsForCluster(spec, k.secretKeySelector)
	if err != nil {
		return nil, err
	}

	client, err := NewClient(kubeconfig, ClientOptions{})
	if err != nil {
		return nil, err
	}

	return client, nil
}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (kubeconfig string, err error) {
	kubeconfig = cloud.Kubevirt.Kubeconfig

	if kubeconfig == "" {
		if cloud.Kubevirt.CredentialsReference == nil {
			return "", errors.New("no credentials provided")
		}
		kubeconfig, err = secretKeySelector(cloud.Kubevirt.CredentialsReference, resources.KubeVirtKubeconfig)
		if err != nil {
			return "", err
		}
	}

	return kubeconfig, nil
}
