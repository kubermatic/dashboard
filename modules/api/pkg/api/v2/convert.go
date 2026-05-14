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

const (
	bytesPerGiB = 1024 * 1024 * 1024
	bytesPerGB  = 1_000_000_000

	// EncodingDecimal is the opt-in HTTP query value that tells quota endpoints
	// to use decimal SI math throughout (1 GB = 10^9 bytes) instead of the
	// legacy binary-as-decimal PR-7729 behavior.
	EncodingDecimal = "decimal"
)

// ConvertToAPIQuota converts a kubermaticv1.ResourceDetails (bytes) into an
// API-side Quota (GB float, 2 decimals).
//
// When encoding == EncodingDecimal the conversion is honest decimal SI:
// bytes / 10^9. Otherwise the legacy PR-7729 path is used: decimal SI suffixes
// in the source Quantity are first reinterpreted as binary IEC via
// TreatDecimalAsBinary, then divided by 2^30. The legacy branch keeps existing
// HTTP clients (and issue kubermatic/dashboard#7715) unchanged.
func ConvertToAPIQuota(resourceDetails kubermaticv1.ResourceDetails, encoding string) Quota {
	quota := Quota{}

	if resourceDetails.CPU != nil {
		cpu := resourceDetails.CPU.Value()
		quota.CPU = &cpu
	}

	if encoding == EncodingDecimal {
		if resourceDetails.Memory != nil && !resourceDetails.Memory.IsZero() {
			memory := math.Round(float64(resourceDetails.Memory.Value())/float64(bytesPerGB)*100) / 100
			quota.Memory = &memory
		}
		if resourceDetails.Storage != nil && !resourceDetails.Storage.IsZero() {
			storage := math.Round(float64(resourceDetails.Storage.Value())/float64(bytesPerGB)*100) / 100
			quota.Storage = &storage
		}
		return quota
	}

	// Legacy PR-7729 path: rewrite decimal suffixes as binary, divide by GiB.
	if resourceDetails.Memory != nil && !resourceDetails.Memory.IsZero() {
		changeToBinary := TreatDecimalAsBinary(resourceDetails.Memory)
		memory := math.Round(float64(changeToBinary.Value())/float64(bytesPerGiB)*100) / 100
		quota.Memory = &memory
	}
	if resourceDetails.Storage != nil && !resourceDetails.Storage.IsZero() {
		changeToBinary := TreatDecimalAsBinary(resourceDetails.Storage)
		storage := math.Round(float64(changeToBinary.Value())/float64(bytesPerGiB)*100) / 100
		quota.Storage = &storage
	}
	return quota
}

// ConvertToCRDQuota converts an API Quota (GB float) into a CRD ResourceDetails.
// The write path has always emitted decimal SI suffixes (G) regardless of the
// HTTP encoding parameter; the dashboard never wrote binary IEC (Gi) suffixes
// to the CRD, and we keep that invariant to avoid silently changing the bytes
// stored in etcd for callers that omit ?encoding=decimal.
//
// The encoding argument is retained in the signature because callers already
// supply it for the read path; the body intentionally does not branch on it.
func ConvertToCRDQuota(quota Quota, encoding string) (kubermaticv1.ResourceDetails, error) {
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
		mem, err = resource.ParseQuantity(fmt.Sprintf("%fG", *quota.Memory))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota Memory %w", err)
		}
		resourceDetails.Memory = &mem
	}

	if quota.Storage != nil {
		storage, err = resource.ParseQuantity(fmt.Sprintf("%fG", *quota.Storage))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota Storage %w", err)
		}
		resourceDetails.Storage = &storage
	}

	return resourceDetails, nil
}

// TreatDecimalAsBinary converts a Quantity that uses decimal SI suffixes
// (K, M, G, T) into one whose bytes are computed against base 1024 instead of
// 1000, so a value like "6500M" produced by `kubectl apply` is treated as
// "6500Mi" for the purposes of legacy dashboard arithmetic and display. This
// matches the convention assumed by issue kubermatic/dashboard#7715. The
// returned Quantity is intended for in-memory math only and is never written
// back to the CRD.
func TreatDecimalAsBinary(q *resource.Quantity) resource.Quantity {
	s := q.String() // e.g. "512M", "25G"

	var value int64
	var unit string
	_, err := fmt.Sscanf(s, "%d%s", &value, &unit)
	if err != nil {
		return *q
	}

	var bytes int64
	units := []string{"K", "M", "G", "T"}
	exponent := 0
	for i, u := range units {
		if u == unit {
			exponent = i + 1
			break
		}
	}
	if exponent == 0 {
		// unit not found, return original quantity
		return *q
	}
	bytes = value * int64(math.Pow(1024, float64(exponent)))

	return *resource.NewQuantity(bytes, resource.BinarySI)
}
