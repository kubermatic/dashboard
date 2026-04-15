/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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
	"reflect"
	"sort"
	"testing"

	kvinstancetypev1alpha1 "kubevirt.io/api/instancetype/v1alpha1"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt"
	kvmanifests "k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt/manifests"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func Test_filterInstancetypes(t *testing.T) {
	tests := []struct {
		name          string
		instancetypes *apiv2.VirtualMachineInstancetypeList
		quota         kubermaticv1.MachineFlavorFilter
		want          *apiv2.VirtualMachineInstancetypeList
	}{
		{
			name: "some filtered out",
			instancetypes: newInstancetypeList().
				addInstanceType(apiv2.InstancetypeCustom, 2, "4Gi").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 3, "4Gi"). // ok
				addInstanceType(apiv2.InstancetypeCustom, 4, "4Gi").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 4, "4Gi"). // ok
				addInstanceType(apiv2.InstancetypeCustom, 1, "4Gi").     // filtered out due to cpu
				addInstanceType(apiv2.InstancetypeCustom, 5, "4Gi").     // filtered out due to cpu
				addInstanceType(apiv2.InstancetypeCustom, 2, "2Gi").     // filtered out due to memory
				addInstanceType(apiv2.InstancetypeCustom, 2, "6Gi").     // filtered out due to memory
				toApiWithoutError(),
			quota: kubermaticv1.MachineFlavorFilter{
				MinCPU: 2,
				MaxCPU: 4,
				MinRAM: 3,
				MaxRAM: 5,
			},
			want: newInstancetypeList().
				addInstanceType(apiv2.InstancetypeCustom, 2, "4295M").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 3, "4295M"). // ok
				addInstanceType(apiv2.InstancetypeCustom, 4, "4295M").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 4, "4295M"). // ok
				toApiWithoutError(),
		},
		{
			name: "some filtered out-due to units",
			instancetypes: newInstancetypeList().
				addInstanceType(apiv2.InstancetypeCustom, 2, "4Mi").     // filtered out due to memory
				addInstanceType(apiv2.InstancetypeKubermatic, 3, "4Ti"). // filtered out due to memory
				toApiWithoutError(),
			quota: kubermaticv1.MachineFlavorFilter{
				MinCPU: 2,
				MaxCPU: 4,
				MinRAM: 3,
				MaxRAM: 5,
			},
			want: newInstancetypeList().
				toApiWithoutError(),
		},
		{
			name: "all filtered out",
			instancetypes: newInstancetypeList().
				addInstanceType(apiv2.InstancetypeCustom, 1, "4Gi").     // filtered out due to cpu
				addInstanceType(apiv2.InstancetypeKubermatic, 5, "4Gi"). // filtered out due to cpu
				addInstanceType(apiv2.InstancetypeCustom, 2, "2Gi").     // filtered out due to memory
				addInstanceType(apiv2.InstancetypeKubermatic, 2, "6Gi"). // filtered out due to memory
				toApiWithoutError(),
			quota: kubermaticv1.MachineFlavorFilter{
				MinCPU: 2,
				MaxCPU: 4,
				MinRAM: 3,
				MaxRAM: 5,
			},
			want: newInstancetypeList().
				toApiWithoutError(),
		},
		{
			name: "all custom-none filtered out",
			instancetypes: newInstancetypeList().
				addInstanceType(apiv2.InstancetypeCustom, 2, "4Gi").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 3, "4Gi"). // ok
				addInstanceType(apiv2.InstancetypeCustom, 4, "4Gi").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 4, "4Gi"). // ok
				toApiWithoutError(),
			quota: kubermaticv1.MachineFlavorFilter{
				MinCPU: 2,
				MaxCPU: 4,
				MinRAM: 3,
				MaxRAM: 5,
			},
			want: newInstancetypeList().
				addInstanceType(apiv2.InstancetypeCustom, 2, "4295M").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 3, "4295M"). // ok
				addInstanceType(apiv2.InstancetypeCustom, 4, "4295M").     // ok
				addInstanceType(apiv2.InstancetypeKubermatic, 4, "4295M"). // ok
				toApiWithoutError(),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := filterInstancetypes(tt.instancetypes, tt.quota); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got\n %+v", got.Instancetypes == nil)
				t.Errorf("want\n %+v", tt.want.Instancetypes == nil)

				t.Errorf("filterInstancetypes() = %v, want %v", got, tt.want)
			}
		})
	}
}

func newInstancetypeList() *instancetypeListWrapper {
	return &instancetypeListWrapper{}
}

func (l *instancetypeListWrapper) toApiWithoutError() *apiv2.VirtualMachineInstancetypeList {
	res, err := l.toApi()
	if err != nil {
		return nil
	}
	return res
}

func (l *instancetypeListWrapper) addInstanceType(category apiv2.VirtualMachineInstancetypeCategory, cpu uint32, memory string) *instancetypeListWrapper {
	w := newInstancetype(category, cpu, memory)

	if l.items == nil {
		l.items = make([]instancetypeWrapper, 0)
	}
	l.items = append(l.items, w)
	return l
}

func newInstancetype(category apiv2.VirtualMachineInstancetypeCategory, cpu uint32, memory string) instancetypeWrapper {
	switch category {
	case apiv2.InstancetypeKubermatic:
		instancetype := &kvinstancetypev1alpha1.VirtualMachineInstancetype{
			ObjectMeta: metav1.ObjectMeta{
				Name: instancetypeName(cpu, memory),
			},
			Spec: getInstancetypeSpec(cpu, memory),
		}

		return &standardInstancetypeWrapper{instancetype}

	case apiv2.InstancetypeCustom:
		instancetype := &kvinstancetypev1alpha1.VirtualMachineClusterInstancetype{
			ObjectMeta: metav1.ObjectMeta{
				Name: instancetypeName(cpu, memory),
			},
			Spec: getInstancetypeSpec(cpu, memory),
		}
		return &customInstancetypeWrapper{instancetype}
	}
	return nil
}

func instancetypeName(cpu uint32, memory string) string {
	memoryAsQuantity, _ := resource.ParseQuantity(memory)
	memoryAsScaledString := resource.NewScaledQuantity(memoryAsQuantity.ScaledValue(resource.Giga), resource.Giga).String()
	return fmt.Sprintf("cpu-%d-memory-%s", cpu, memoryAsScaledString)
}

func getInstancetypeSpec(cpu uint32, memory string) kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec {
	return kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec{
		CPU: kvinstancetypev1alpha1.CPUInstancetype{
			Guest: cpu,
		},
		Memory: kvinstancetypev1alpha1.MemoryInstancetype{
			Guest: resource.MustParse(memory),
		},
	}
}

// newFakeClient builds a controller-runtime fake client with the KubeVirt
// instancetype scheme registered and the given objects pre-created.
func newFakeClient(t *testing.T, objs ...ctrlruntimeclient.Object) ctrlruntimeclient.Client {
	t.Helper()
	scheme := runtime.NewScheme()
	if err := kvinstancetypev1alpha1.AddToScheme(scheme); err != nil {
		t.Fatalf("failed to register KubeVirt instancetype scheme: %v", err)
	}
	return fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(objs...).
		Build()
}

// standardNamesFromManifests derives the set of kubermatic standard instancetype
// names from the actual embedded manifests, so tests stay correct when manifests
// are added or renamed without any code changes.
func standardNamesFromManifests(t *testing.T) []string {
	t.Helper()
	client := newFakeClient(t)
	items := kubevirt.GetKubermaticStandardInstancetypes(client, &kvmanifests.StandardInstancetypeGetter{})
	names := make([]string, 0, len(items))
	for _, it := range items {
		names = append(names, it.Name)
	}
	sort.Strings(names)
	return names
}

func Test_kubeVirtInstancetypes(t *testing.T) {
	ctx := context.Background()

	// Derive standard names from the actual embedded manifests so the test
	// stays correct even when manifests are added or renamed.
	standardNames := standardNamesFromManifests(t)

	// staleStandardInstanceTypes returns namespace-scoped VirtualMachineInstancetype objects
	// whose names match the standard set — simulating instancetypes that were
	// previously reconciled into a namespace and still exist there.
	staleStandardInstanceTypes := func(namespace string) []ctrlruntimeclient.Object {
		objs := make([]ctrlruntimeclient.Object, 0, len(standardNames))
		for _, name := range standardNames {
			objs = append(objs, &kvinstancetypev1alpha1.VirtualMachineInstancetype{
				ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
				Spec:       getInstancetypeSpec(2, "8Gi"),
			})
		}
		return objs
	}

	tests := []struct {
		name      string
		dc        *kubermaticv1.Datacenter
		objects   []ctrlruntimeclient.Object // pre-existing objects in the fake cluster
		wantNames map[apiv2.VirtualMachineInstancetypeCategory][]string
		wantErr   bool
	}{
		{
			name: "non-namespaced mode: only cluster-wide custom + kubermatic standards",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{},
				},
			},
			objects: []ctrlruntimeclient.Object{
				&kvinstancetypev1alpha1.VirtualMachineClusterInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "cluster-custom-1"},
					Spec:       getInstancetypeSpec(4, "8Gi"),
				},
			},
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				apiv2.InstancetypeCustom:     {"cluster-custom-1"},
				apiv2.InstancetypeKubermatic: standardNames,
			},
		},
		{
			name: "non-namespaced mode: does NOT list namespaced instancetypes (cross-tenant leak fix)",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{
						// NamespacedMode is nil → non-namespaced mode
					},
				},
			},
			objects: []ctrlruntimeclient.Object{
				// Namespaced instancetype in some tenant namespace — must NOT appear.
				&kvinstancetypev1alpha1.VirtualMachineInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "tenant-it", Namespace: "tenant-ns-1"},
					Spec:       getInstancetypeSpec(2, "4Gi"),
				},
			},
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				apiv2.InstancetypeKubermatic: standardNames,
			},
		},
		{
			name: "namespaced mode: user-created instancetype categorized as custom",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{
						NamespacedMode: &kubermaticv1.NamespacedMode{
							Enabled:   true,
							Namespace: "infra-ns",
						},
					},
				},
			},
			objects: []ctrlruntimeclient.Object{
				&kvinstancetypev1alpha1.VirtualMachineInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "user-created", Namespace: "infra-ns"},
					Spec:       getInstancetypeSpec(4, "16Gi"),
				},
			},
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				apiv2.InstancetypeCustom:     {"user-created"},
				apiv2.InstancetypeKubermatic: standardNames,
			},
		},
		{
			name: "namespaced mode: existing standard instancetypes are filtered out from custom list",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{
						NamespacedMode: &kubermaticv1.NamespacedMode{
							Enabled:   true,
							Namespace: "infra-ns",
						},
					},
				},
			},
			objects: append(staleStandardInstanceTypes("infra-ns"),
				// Plus a real user-created one.
				&kvinstancetypev1alpha1.VirtualMachineInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "my-flavor", Namespace: "infra-ns"},
					Spec:       getInstancetypeSpec(8, "32Gi"),
				},
			),
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				// standard-2 and standard-4 must appear under Kubermatic (from manifests),
				// NOT duplicated under Custom from the namespace listing.
				apiv2.InstancetypeCustom:     {"my-flavor"},
				apiv2.InstancetypeKubermatic: standardNames,
			},
		},
		{
			name: "defaults disabled: standard instancetypes not returned, existing ones in namespace filtered",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{
						DisableDefaultInstanceTypes: true,
						NamespacedMode: &kubermaticv1.NamespacedMode{
							Enabled:   true,
							Namespace: "infra-ns",
						},
					},
				},
			},
			objects: append(staleStandardInstanceTypes("infra-ns"),
				// A real user-created instancetype.
				&kvinstancetypev1alpha1.VirtualMachineInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "my-custom", Namespace: "infra-ns"},
					Spec:       getInstancetypeSpec(16, "64Gi"),
				},
			),
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				// No Kubermatic standards should appear at all (disabled).
				// Lingering standard-2/4/8 must NOT leak through as Custom.
				apiv2.InstancetypeCustom: {"my-custom"},
			},
		},
		{
			name: "defaults disabled, namespaced mode, only existing standards: empty result",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{
						DisableDefaultInstanceTypes: true,
						NamespacedMode: &kubermaticv1.NamespacedMode{
							Enabled:   true,
							Namespace: "infra-ns",
						},
					},
				},
			},
			// Only previously-reconciled standard instancetypes exist in the
			// namespace — no user-created custom ones exist.  With defaults
			// disabled these must all be filtered out, yielding an empty result.
			objects:   staleStandardInstanceTypes("infra-ns"),
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{},
		},
		{
			name: "defaults disabled, no namespaced mode: empty result",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{
						DisableDefaultInstanceTypes: true,
					},
				},
			},
			objects:   []ctrlruntimeclient.Object{},
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := newFakeClient(t, tt.objects...)
			got, err := kubeVirtInstancetypes(ctx, client, tt.dc)
			if (err != nil) != tt.wantErr {
				t.Fatalf("kubeVirtInstancetypes() error = %v, wantErr %v", err, tt.wantErr)
			}

			if gotNames := sortedCategoryNames(got.items); !reflect.DeepEqual(gotNames, tt.wantNames) {
				t.Errorf("kubeVirtInstancetypes() names =\n  %v\nwant:\n  %v", gotNames, tt.wantNames)
			}
		})
	}
}

// sortedCategoryNames groups instancetype items by category and sorts each
// name slice, producing a map ready for reflect.DeepEqual against tt.wantNames.
func sortedCategoryNames(items []instancetypeWrapper) map[apiv2.VirtualMachineInstancetypeCategory][]string {
	m := make(map[apiv2.VirtualMachineInstancetypeCategory][]string)
	for _, item := range items {
		m[item.Category()] = append(m[item.Category()], item.GetObjectMeta().GetName())
	}
	for cat := range m {
		sort.Strings(m[cat])
	}
	return m
}
