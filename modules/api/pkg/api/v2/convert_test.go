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
	"encoding/json"
	"reflect"
	"strings"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestConvertToAPIQuotaAccelerators(t *testing.T) {
	t.Parallel()

	resourceDetails := kubermaticv1.ResourceDetails{
		Accelerators: []kubermaticv1.AcceleratorQuota{
			{
				Provider: "kubevirt",
				Resources: corev1.ResourceList{
					"nvidia.com/A100": resource.MustParse("0"),
					"nvidia.com/H100": resource.MustParse("2"),
				},
			},
			{
				Provider: "future-provider",
				Resources: corev1.ResourceList{
					"nvidia.com/A100": resource.MustParse("7"),
				},
			},
		},
	}

	converted := apiv2.ConvertToAPIQuota(resourceDetails)
	if converted.Accelerators == nil {
		t.Fatal("expected accelerator quota to be present")
	}

	expected := []apiv2.AcceleratorQuota{
		{
			Provider: "kubevirt",
			Resources: map[string]string{
				"nvidia.com/A100": "0",
				"nvidia.com/H100": "2",
			},
		},
		{
			Provider: "future-provider",
			Resources: map[string]string{
				"nvidia.com/A100": "7",
			},
		},
	}
	if !reflect.DeepEqual(expected, *converted.Accelerators) {
		t.Fatalf("unexpected accelerator quota: got %#v, want %#v", *converted.Accelerators, expected)
	}

	(*converted.Accelerators)[0].Resources["nvidia.com/A100"] = "9"
	if quantity := resourceDetails.Accelerators[0].Resources["nvidia.com/A100"]; !quantity.IsZero() {
		t.Fatalf("conversion result aliases source resource list: got %s, want 0", quantity.String())
	}
}

func TestConvertToAPIGlobalAcceleratorAccountingStatus(t *testing.T) {
	t.Parallel()

	observedAt := metav1.Now()
	status := &kubermaticv1.ResourceQuotaGlobalAcceleratorAccountingStatus{
		ActivationPhase:                kubermaticv1.AcceleratorAccountingPhaseBlocked,
		ObservedAccountingRevision:     "revision-2",
		ObservedQuotaDigest:            "sha256:digest",
		ObservedAt:                     observedAt,
		LegacyMachinesWithoutFootprint: 3,
		MachinesWithInvalidFootprint:   2,
		Blockers: []kubermaticv1.AcceleratorAccountingBlocker{
			{
				Type:        kubermaticv1.AcceleratorAccountingBlockerTypeInvalidFootprints,
				Message:     "invalid machine footprints",
				SeedName:    "seed-a",
				ClusterName: "cluster-a",
				Count:       2,
			},
		},
	}
	apiObservedAt := apiv1.NewTime(observedAt.Time)
	expected := &apiv2.ResourceQuotaGlobalAcceleratorAccountingStatus{
		ActivationPhase:                "Blocked",
		ObservedAccountingRevision:     "revision-2",
		ObservedQuotaDigest:            "sha256:digest",
		ObservedAt:                     &apiObservedAt,
		LegacyMachinesWithoutFootprint: 3,
		MachinesWithInvalidFootprint:   2,
		Ready:                          false,
		Blockers: []apiv2.AcceleratorAccountingBlocker{
			{
				Type:        "InvalidFootprints",
				Message:     "invalid machine footprints",
				SeedName:    "seed-a",
				ClusterName: "cluster-a",
				Count:       2,
			},
		},
	}

	converted := apiv2.ConvertToAPIGlobalAcceleratorAccountingStatus(status)
	if !reflect.DeepEqual(expected, converted) {
		t.Fatalf("unexpected accelerator accounting status: got %#v, want %#v", converted, expected)
	}

	converted.Blockers[0].Message = "changed"
	if got := status.Blockers[0].Message; got != "invalid machine footprints" {
		t.Fatalf("conversion result aliases source blockers: got %q", got)
	}
}

func TestConvertToAPIGlobalAcceleratorAccountingStatusOptionalFields(t *testing.T) {
	t.Parallel()

	if got := apiv2.ConvertToAPIGlobalAcceleratorAccountingStatus(nil); got != nil {
		t.Fatalf("nil status converted to %#v", got)
	}

	converted := apiv2.ConvertToAPIGlobalAcceleratorAccountingStatus(&kubermaticv1.ResourceQuotaGlobalAcceleratorAccountingStatus{})
	if converted.ObservedAt != nil {
		t.Fatalf("zero observedAt converted to %#v", converted.ObservedAt)
	}
	if converted.Blockers != nil {
		t.Fatalf("nil blockers converted to %#v", converted.Blockers)
	}
}

func TestConvertToAPIQuotaAcceleratorPresence(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name             string
		accelerators     []kubermaticv1.AcceleratorQuota
		expectPresent    bool
		expectedJSONBody string
	}{
		{
			name:             "absent accelerator field remains absent",
			expectedJSONBody: "{}",
		},
		{
			name:             "explicit empty accelerator field remains present",
			accelerators:     []kubermaticv1.AcceleratorQuota{},
			expectPresent:    true,
			expectedJSONBody: `{"accelerators":[]}`,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			converted := apiv2.ConvertToAPIQuota(kubermaticv1.ResourceDetails{Accelerators: testCase.accelerators})
			if got := converted.Accelerators != nil; got != testCase.expectPresent {
				t.Fatalf("accelerator presence: got %t, want %t", got, testCase.expectPresent)
			}

			encoded, err := json.Marshal(converted)
			if err != nil {
				t.Fatalf("failed to marshal converted quota: %v", err)
			}
			if got := string(encoded); got != testCase.expectedJSONBody {
				t.Fatalf("unexpected JSON: got %s, want %s", got, testCase.expectedJSONBody)
			}
		})
	}
}

func TestConvertToCRDQuotaAccelerators(t *testing.T) {
	t.Parallel()

	accelerators := []apiv2.AcceleratorQuota{
		{
			Provider: "kubevirt",
			Resources: map[string]string{
				"nvidia.com/a100": "0",
				"nvidia.com/h100": "2",
			},
		},
		{
			Provider: "future-provider",
			Resources: map[string]string{
				"nvidia.com/a100": "7",
			},
		},
	}

	converted, err := apiv2.ConvertToCRDQuota(apiv2.Quota{Accelerators: &accelerators})
	if err != nil {
		t.Fatalf("failed to convert accelerator quota: %v", err)
	}
	expected := []kubermaticv1.AcceleratorQuota{
		{
			Provider: "kubevirt",
			Resources: corev1.ResourceList{
				"nvidia.com/a100": resource.MustParse("0"),
				"nvidia.com/h100": resource.MustParse("2"),
			},
		},
		{
			Provider: "future-provider",
			Resources: corev1.ResourceList{
				"nvidia.com/a100": resource.MustParse("7"),
			},
		},
	}
	if !reflect.DeepEqual(expected, converted.Accelerators) {
		t.Fatalf("unexpected accelerator quota: got %#v, want %#v", converted.Accelerators, expected)
	}

	converted.Accelerators[0].Resources["nvidia.com/a100"] = resource.MustParse("9")
	if got := accelerators[0].Resources["nvidia.com/a100"]; got != "0" {
		t.Fatalf("conversion result aliases source resources: got %q, want 0", got)
	}
}

func TestConvertToCRDQuotaAcceleratorPresence(t *testing.T) {
	t.Parallel()

	converted, err := apiv2.ConvertToCRDQuota(apiv2.Quota{})
	if err != nil {
		t.Fatalf("failed to convert absent accelerator quota: %v", err)
	}
	if converted.Accelerators != nil {
		t.Fatalf("absent accelerator field converted to %#v", converted.Accelerators)
	}

	empty := []apiv2.AcceleratorQuota{}
	converted, err = apiv2.ConvertToCRDQuota(apiv2.Quota{Accelerators: &empty})
	if err != nil {
		t.Fatalf("failed to convert empty accelerator quota: %v", err)
	}
	if converted.Accelerators == nil || len(converted.Accelerators) != 0 {
		t.Fatalf("explicit empty accelerator field converted to %#v", converted.Accelerators)
	}
}

func TestConvertToCRDQuotaRejectsInvalidAcceleratorQuantity(t *testing.T) {
	t.Parallel()

	accelerators := []apiv2.AcceleratorQuota{
		{
			Provider: "kubevirt",
			Resources: map[string]string{
				"nvidia.com/gpu": "not-a-quantity",
			},
		},
	}
	_, err := apiv2.ConvertToCRDQuota(apiv2.Quota{Accelerators: &accelerators})
	if err == nil {
		t.Fatal("expected invalid accelerator quantity to be rejected")
	}
	if !strings.Contains(err.Error(), `accelerator quota "kubevirt" resource "nvidia.com/gpu"`) {
		t.Fatalf("unexpected error: %v", err)
	}
}
