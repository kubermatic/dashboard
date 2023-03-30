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

package alibaba

import (
	"errors"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
)

type Alibaba struct {
	dc                *kubermaticv1.DatacenterSpecAlibaba
	secretKeySelector provider.SecretKeySelectorValueFunc
}

var _ provider.CloudProvider = &Alibaba{}

func NewCloudProvider(dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc) (*Alibaba, error) {
	if dc.Spec.Alibaba == nil {
		return nil, errors.New("datacenter is not an Alibaba datacenter")
	}
	return &Alibaba{
		dc:                dc.Spec.Alibaba,
		secretKeySelector: secretKeyGetter,
	}, nil
}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc, dc *kubermaticv1.DatacenterSpecAlibaba) (accessKeyID string, accessKeySecret string, err error) {
	accessKeyID = cloud.Alibaba.AccessKeyID
	accessKeySecret = cloud.Alibaba.AccessKeySecret

	if accessKeyID == "" {
		if cloud.Alibaba.CredentialsReference == nil {
			return "", "", errors.New("no credentials provided, accessKeyID cannot be empty")
		}
		accessKeyID, err = secretKeySelector(cloud.Alibaba.CredentialsReference, resources.AlibabaAccessKeyID)
		if err != nil {
			return "", "", err
		}
	}

	if accessKeySecret == "" {
		if cloud.Alibaba.CredentialsReference == nil {
			return "", "", errors.New("no credentials provided, accessKeySecret cannot be empty")
		}
		accessKeySecret, err = secretKeySelector(cloud.Alibaba.CredentialsReference, resources.AlibabaAccessKeySecret)
		if err != nil {
			return "", "", err
		}
	}

	return accessKeyID, accessKeySecret, nil
}
