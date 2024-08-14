/*
Copyright 2024 The Kubermatic Kubernetes Platform contributors.

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

package baremetal

import (
	"errors"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
)

type baremetal struct {
	secretKeySelector provider.SecretKeySelectorValueFunc
	dc                *kubermaticv1.DatacenterSpecBaremetal
}

func NewCloudProvider(dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc) (provider.CloudProvider, error) {
	if dc.Spec.Kubevirt == nil {
		return nil, errors.New("datacenter is not an Baremetal datacenter")
	}
	return &baremetal{
		secretKeySelector: secretKeyGetter,
		dc:                dc.Spec.Baremetal,
	}, nil
}

var _ provider.CloudProvider = &baremetal{}
