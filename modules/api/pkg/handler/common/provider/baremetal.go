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

package provider

import (
	"context"
	"fmt"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
)

// TinkerbellImages returns supported Tinkerbell images.
func TinkerbellImages(ctx context.Context, datacenterName string, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (*apiv2.TinkerbellImagesList, error) {
	res := &apiv2.TinkerbellImagesList{
		Standard: apiv2.TinkerbellImages{
			Source:           apiv2.TinkerbellImageHTTPSourceType,
			OperatingSystems: kubermaticv1.ImageListWithVersions{},
		},
	}

	for os := range kubermaticv1.SupportedTinkerbellOS {
		res.Standard.OperatingSystems[os] = map[string]string{}
	}

	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("error getting dc: %w", err)
	}

	if datacenter.Spec.Baremetal == nil {
		return nil, fmt.Errorf("Baremetal datacenter spec is required")
	}

	if datacenter.Spec.Baremetal.Tinkerbell == nil {
		return nil, fmt.Errorf("Tinkerbell provisioner spec is empty")
	}

	httpSource := datacenter.Spec.Baremetal.Tinkerbell.Images.HTTP
	if httpSource != nil {
		for os, versions := range httpSource.OperatingSystems {
			// Ensure the sub-map for the operating system is initialized
			if _, ok := res.Standard.OperatingSystems[os]; !ok {
				res.Standard.OperatingSystems[os] = map[string]string{}
			}
			for version, link := range versions {
				res.Standard.OperatingSystems[os][version] = link
			}
		}
	}

	return res, nil
}
