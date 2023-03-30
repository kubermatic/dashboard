/*
Copyright 2021 The Kubermatic Kubernetes Platform contributors.

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
	"context"
	"errors"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/subscription/armsubscription"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	kubermaticresources "k8c.io/kubermatic/v2/pkg/resources"
)

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (Credentials, error) {
	tenantID := cloud.Azure.TenantID
	subscriptionID := cloud.Azure.SubscriptionID
	clientID := cloud.Azure.ClientID
	clientSecret := cloud.Azure.ClientSecret
	var err error

	if tenantID == "" {
		if cloud.Azure.CredentialsReference == nil {
			return Credentials{}, errors.New("no credentials provided")
		}
		tenantID, err = secretKeySelector(cloud.Azure.CredentialsReference, kubermaticresources.AzureTenantID)
		if err != nil {
			return Credentials{}, err
		}
	}

	if subscriptionID == "" {
		if cloud.Azure.CredentialsReference == nil {
			return Credentials{}, errors.New("no credentials provided")
		}
		subscriptionID, err = secretKeySelector(cloud.Azure.CredentialsReference, kubermaticresources.AzureSubscriptionID)
		if err != nil {
			return Credentials{}, err
		}
	}

	if clientID == "" {
		if cloud.Azure.CredentialsReference == nil {
			return Credentials{}, errors.New("no credentials provided")
		}
		clientID, err = secretKeySelector(cloud.Azure.CredentialsReference, kubermaticresources.AzureClientID)
		if err != nil {
			return Credentials{}, err
		}
	}

	if clientSecret == "" {
		if cloud.Azure.CredentialsReference == nil {
			return Credentials{}, errors.New("no credentials provided")
		}
		clientSecret, err = secretKeySelector(cloud.Azure.CredentialsReference, kubermaticresources.AzureClientSecret)
		if err != nil {
			return Credentials{}, err
		}
	}

	return Credentials{
		TenantID:       tenantID,
		SubscriptionID: subscriptionID,
		ClientID:       clientID,
		ClientSecret:   clientSecret,
	}, nil
}

func ValidateCredentials(ctx context.Context, credentials *azidentity.ClientSecretCredential, subscriptionID string) error {
	subscriptionClient, err := armsubscription.NewSubscriptionsClient(credentials, nil)
	if err != nil {
		return err
	}

	_, err = subscriptionClient.Get(ctx, subscriptionID, nil)

	return err
}
