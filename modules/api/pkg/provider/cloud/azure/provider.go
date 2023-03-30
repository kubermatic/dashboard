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

package azure

import (
	"errors"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"go.uber.org/zap"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"
)

type Azure struct {
	dc                *kubermaticv1.DatacenterSpecAzure
	log               *zap.SugaredLogger
	secretKeySelector provider.SecretKeySelectorValueFunc
}

// New returns a new Azure provider.
func New(dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc) (*Azure, error) {
	if dc.Spec.Azure == nil {
		return nil, errors.New("datacenter is not an Azure datacenter")
	}
	return &Azure{
		dc:                dc.Spec.Azure,
		log:               log.Logger,
		secretKeySelector: secretKeyGetter,
	}, nil
}

var _ provider.CloudProvider = &Azure{}

type Credentials struct {
	TenantID       string
	SubscriptionID string
	ClientID       string
	ClientSecret   string
}

func (c Credentials) ToAzureCredential() (*azidentity.ClientSecretCredential, error) {
	return azidentity.NewClientSecretCredential(c.TenantID, c.ClientID, c.ClientSecret, nil)
}
