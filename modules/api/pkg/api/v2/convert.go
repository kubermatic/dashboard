/*
Copyright 2023 The Kubermatic Kubernetes Platform contributors.

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

package v2

import (
	"fmt"
	"math"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/api/resource"
)

func ConvertToAPIQuota(resourceDetails kubermaticv1.ResourceDetails) Quota {
	quota := Quota{}

	if resourceDetails.CPU != nil {
		cpu := resourceDetails.CPU.Value()
		quota.CPU = &cpu
	}

	// Get memory and storage denoted in GB
	if resourceDetails.Memory != nil && !resourceDetails.Memory.IsZero() {
		memory := float64(resourceDetails.Memory.Value()) / math.Pow(1024, 3)
		// round to 2 decimal places
		memory = math.Round(memory*100) / 100
		quota.Memory = &memory
	}
	//
	if resourceDetails.Storage != nil && !resourceDetails.Storage.IsZero() {
		storage := float64(resourceDetails.Storage.Value()) / math.Pow(1024, 3)
		// round to 2 decimal places
		storage = math.Round(storage*100) / 100
		quota.Storage = &storage
	}
	return quota
}

func ConvertToCRDQuota(quota Quota) (kubermaticv1.ResourceDetails, error) {
	resourceDetails := kubermaticv1.ResourceDetails{}
	var cpu, mem, storage resource.Quantity
	var err error

	if quota.CPU != nil {
		cpu, err = resource.ParseQuantity(fmt.Sprintf("%d", *quota.CPU))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota CPU %w", err)
		}
		resourceDetails.CPU = &cpu
	}

	if quota.Memory != nil {
		mem, err = resource.ParseQuantity(fmt.Sprintf("%fGi", *quota.Memory))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota Memory %w", err)
		}
		resourceDetails.Memory = &mem
	}

	if quota.Storage != nil {
		storage, err = resource.ParseQuantity(fmt.Sprintf("%fGi", *quota.Storage))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota Memory %w", err)
		}
		resourceDetails.Storage = &storage
	}

	return resourceDetails, nil
}
