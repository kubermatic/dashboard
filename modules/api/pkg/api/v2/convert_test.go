/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package v2_test

import (
	"reflect"
	"testing"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/utils/ptr"
)

func mustQuantity(s string) *resource.Quantity {
	q := resource.MustParse(s)
	return &q
}

func TestConvertToAPIQuota(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		encoding string
		quota    kubermaticv1.ResourceDetails
		expected apiv2.Quota
	}{
		{
			name:     "scenario 1: legacy mode treats decimal M as binary Mi",
			encoding: "",
			quota: kubermaticv1.ResourceDetails{
				CPU:     mustQuantity("4"),
				Memory:  mustQuantity("6500M"),
				Storage: mustQuantity("60500M"),
			},
			expected: apiv2.Quota{
				CPU:     ptr.To[int64](4),
				Memory:  ptr.To(6.35),
				Storage: ptr.To(59.08),
			},
		},
		{
			name:     "scenario 2: legacy mode passes binary Gi through unchanged",
			encoding: "",
			quota: kubermaticv1.ResourceDetails{
				Memory:  mustQuantity("6Gi"),
				Storage: mustQuantity("125Gi"),
			},
			expected: apiv2.Quota{
				Memory:  ptr.To(6.0),
				Storage: ptr.To(125.0),
			},
		},
		{
			name:     "scenario 3: decimal mode reports decimal M as decimal GB",
			encoding: apiv2.EncodingDecimal,
			quota: kubermaticv1.ResourceDetails{
				CPU:     mustQuantity("4"),
				Memory:  mustQuantity("6500M"),
				Storage: mustQuantity("60500M"),
			},
			expected: apiv2.Quota{
				CPU:     ptr.To[int64](4),
				Memory:  ptr.To(6.5),
				Storage: ptr.To(60.5),
			},
		},
		{
			name:     "scenario 4: decimal mode converts binary Gi to decimal GB equivalent",
			encoding: apiv2.EncodingDecimal,
			quota: kubermaticv1.ResourceDetails{
				Memory:  mustQuantity("6Gi"),
				Storage: mustQuantity("125Gi"),
			},
			expected: apiv2.Quota{
				Memory:  ptr.To(6.44),
				Storage: ptr.To(134.22),
			},
		},
		{
			name:     "scenario 5: zero memory and storage are omitted",
			encoding: apiv2.EncodingDecimal,
			quota: kubermaticv1.ResourceDetails{
				CPU:     mustQuantity("2"),
				Memory:  mustQuantity("0"),
				Storage: mustQuantity("0"),
			},
			expected: apiv2.Quota{
				CPU: ptr.To[int64](2),
			},
		},
		{
			name:     "scenario 6: nil fields stay nil",
			encoding: apiv2.EncodingDecimal,
			quota:    kubermaticv1.ResourceDetails{},
			expected: apiv2.Quota{},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := apiv2.ConvertToAPIQuota(test.quota, test.encoding)
			if !reflect.DeepEqual(result, test.expected) {
				t.Fatalf("expected %+v got %+v", test.expected, result)
			}
		})
	}
}

func TestConvertToCRDQuota(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		encoding        string
		quota           apiv2.Quota
		expectedMemory  int64
		expectedStorage int64
		expectedCPU     int64
	}{
		{
			name:     "scenario 1: legacy mode writes decimal G suffix",
			encoding: "",
			quota: apiv2.Quota{
				CPU:     ptr.To[int64](24),
				Memory:  ptr.To(33.5),
				Storage: ptr.To(60.5),
			},
			expectedMemory:  33_500_000_000,
			expectedStorage: 60_500_000_000,
			expectedCPU:     24,
		},
		{
			name:     "scenario 2: decimal mode writes decimal G suffix",
			encoding: apiv2.EncodingDecimal,
			quota: apiv2.Quota{
				CPU:     ptr.To[int64](24),
				Memory:  ptr.To(33.5),
				Storage: ptr.To(60.5),
			},
			expectedMemory:  33_500_000_000,
			expectedStorage: 60_500_000_000,
			expectedCPU:     24,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result, err := apiv2.ConvertToCRDQuota(test.quota, test.encoding)
			if err != nil {
				t.Fatal(err)
			}
			if got := result.Memory.Value(); got != test.expectedMemory {
				t.Fatalf("expected Memory bytes %d got %d", test.expectedMemory, got)
			}
			if got := result.Storage.Value(); got != test.expectedStorage {
				t.Fatalf("expected Storage bytes %d got %d", test.expectedStorage, got)
			}
			if got := result.CPU.Value(); got != test.expectedCPU {
				t.Fatalf("expected CPU %d got %d", test.expectedCPU, got)
			}
		})
	}
}
