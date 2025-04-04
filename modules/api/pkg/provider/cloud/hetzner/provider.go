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

package hetzner

import (
	"context"
	"errors"
	"time"

	"github.com/hetznercloud/hcloud-go/hcloud"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
)

type hetzner struct {
	secretKeySelector provider.SecretKeySelectorValueFunc
}

// NewCloudProvider creates a new hetzner provider.
func NewCloudProvider(secretKeyGetter provider.SecretKeySelectorValueFunc) provider.CloudProvider {
	return &hetzner{
		secretKeySelector: secretKeyGetter,
	}
}

var _ provider.CloudProvider = &hetzner{}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (hetznerToken string, err error) {
	hetznerToken = cloud.Hetzner.Token

	if hetznerToken == "" {
		if cloud.Hetzner.CredentialsReference == nil {
			return "", errors.New("no credentials provided")
		}
		hetznerToken, err = secretKeySelector(cloud.Hetzner.CredentialsReference, resources.HetznerToken)
		if err != nil {
			return "", err
		}
	}

	return hetznerToken, nil
}

func ValidateCredentials(ctx context.Context, token string) error {
	client := hcloud.NewClient(hcloud.WithToken(token))

	timeout, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	opts := hcloud.LocationListOpts{}
	opts.PerPage = 1
	_, _, err := client.Location.List(timeout, opts)
	return err
}
