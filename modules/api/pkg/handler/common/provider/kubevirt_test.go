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
	"encoding/json"
	"fmt"
	"reflect"
	"sort"
	"testing"

	kubevirtcorev1 "kubevirt.io/api/core/v1"
	kvinstancetypev1alpha1 "kubevirt.io/api/instancetype/v1alpha1"
	kvinstancetypev1beta1 "kubevirt.io/api/instancetype/v1beta1"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt"
	kvmanifests "k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt/manifests"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
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
		{
			name: "gpu instancetype passes cpu/ram filter",
			instancetypes: &apiv2.VirtualMachineInstancetypeList{
				Instancetypes: map[apiv2.VirtualMachineInstancetypeCategory][]apiv2.VirtualMachineInstancetype{
					apiv2.InstancetypeCustom: {
						mustMarshalInstancetype("standard-gpu-2", getGPUInstancetypeSpec(2, "8Gi", "A100", "nv-a100-standard")),
					},
				},
			},
			quota: kubermaticv1.MachineFlavorFilter{
				MinCPU: 1,
				MaxCPU: 4,
				MinRAM: 4,
				MaxRAM: 16,
			},
			want: &apiv2.VirtualMachineInstancetypeList{
				Instancetypes: map[apiv2.VirtualMachineInstancetypeCategory][]apiv2.VirtualMachineInstancetype{
					apiv2.InstancetypeCustom: {
						mustMarshalInstancetype("standard-gpu-2", mustScaleMemory(getGPUInstancetypeSpec(2, "8Gi", "A100", "nv-a100-standard"))),
					},
				},
			},
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
		instancetype := &kvinstancetypev1beta1.VirtualMachineInstancetype{
			ObjectMeta: metav1.ObjectMeta{
				Name: instancetypeName(cpu, memory),
			},
			Spec: getInstancetypeSpec(cpu, memory),
		}

		return &standardInstancetypeWrapper{instancetype}

	case apiv2.InstancetypeCustom:
		instancetype := &kvinstancetypev1beta1.VirtualMachineClusterInstancetype{
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

func getInstancetypeSpec(cpu uint32, memory string) kvinstancetypev1beta1.VirtualMachineInstancetypeSpec {
	return kvinstancetypev1beta1.VirtualMachineInstancetypeSpec{
		CPU: kvinstancetypev1beta1.CPUInstancetype{
			Guest: cpu,
		},
		Memory: kvinstancetypev1beta1.MemoryInstancetype{
			Guest: resource.MustParse(memory),
		},
	}
}

func getGPUInstancetypeSpec(cpu uint32, memory, gpuName, deviceName string) kvinstancetypev1beta1.VirtualMachineInstancetypeSpec {
	return kvinstancetypev1beta1.VirtualMachineInstancetypeSpec{
		CPU: kvinstancetypev1beta1.CPUInstancetype{
			Guest: cpu,
		},
		Memory: kvinstancetypev1beta1.MemoryInstancetype{
			Guest: resource.MustParse(memory),
		},
		GPUs: []kubevirtcorev1.GPU{
			{
				Name:       gpuName,
				DeviceName: deviceName,
			},
		},
	}
}

// mustMarshalInstancetype builds an apiv2.VirtualMachineInstancetype with the spec JSON-marshalled.
func mustMarshalInstancetype(name string, spec kvinstancetypev1beta1.VirtualMachineInstancetypeSpec) apiv2.VirtualMachineInstancetype {
	b, err := json.Marshal(spec)
	if err != nil {
		panic(err)
	}
	return apiv2.VirtualMachineInstancetype{Name: name, Spec: string(b)}
}

// mustScaleMemory returns a copy of spec with Memory.Guest converted from BinarySI to
// DecimalSI (Mega), matching what filterInstancetypes does before returning.
func mustScaleMemory(spec kvinstancetypev1beta1.VirtualMachineInstancetypeSpec) kvinstancetypev1beta1.VirtualMachineInstancetypeSpec {
	spec.Memory.Guest = *resource.NewScaledQuantity(spec.Memory.Guest.ScaledValue(resource.Mega), resource.Mega)
	return spec
}

// newFakeClient builds a controller-runtime fake client with the KubeVirt
// instancetype scheme registered and the given objects pre-created.
func newFakeClient(t *testing.T, objs ...ctrlruntimeclient.Object) ctrlruntimeclient.Client {
	t.Helper()
	scheme := runtime.NewScheme()
	if err := kvinstancetypev1beta1.AddToScheme(scheme); err != nil {
		t.Fatalf("failed to register KubeVirt instancetype v1beta1 scheme: %v", err)
	}
	if err := kvinstancetypev1alpha1.AddToScheme(scheme); err != nil {
		t.Fatalf("failed to register KubeVirt instancetype v1alpha1 scheme: %v", err)
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
			objs = append(objs, &kvinstancetypev1beta1.VirtualMachineInstancetype{
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
				&kvinstancetypev1beta1.VirtualMachineClusterInstancetype{
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
				&kvinstancetypev1beta1.VirtualMachineInstancetype{
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
				&kvinstancetypev1beta1.VirtualMachineInstancetype{
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
				&kvinstancetypev1beta1.VirtualMachineInstancetype{
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
				&kvinstancetypev1beta1.VirtualMachineInstancetype{
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
		{
			name: "non-namespaced mode: gpu cluster instancetype returned as custom",
			dc: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Kubevirt: &kubermaticv1.DatacenterSpecKubevirt{},
				},
			},
			objects: []ctrlruntimeclient.Object{
				&kvinstancetypev1beta1.VirtualMachineClusterInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "standard-gpu-2"},
					Spec:       getGPUInstancetypeSpec(2, "8Gi", "A100", "nv-a100-standard"),
				},
			},
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				apiv2.InstancetypeCustom:     {"standard-gpu-2"},
				apiv2.InstancetypeKubermatic: standardNames,
			},
		},
		{
			name: "namespaced mode: gpu instancetype deployed in infra namespace returned as custom",
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
				&kvinstancetypev1beta1.VirtualMachineInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "standard-gpu-2", Namespace: "infra-ns"},
					Spec:       getGPUInstancetypeSpec(2, "8Gi", "A100", "nv-a100-standard"),
				},
			},
			wantNames: map[apiv2.VirtualMachineInstancetypeCategory][]string{
				apiv2.InstancetypeCustom:     {"standard-gpu-2"},
				apiv2.InstancetypeKubermatic: standardNames,
			},
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

func Test_instancetypeWrapperKind(t *testing.T) {
	spec := getInstancetypeSpec(4, "8Gi")

	namespaced := &kvinstancetypev1beta1.VirtualMachineInstancetype{Spec: spec}
	cluster := &kvinstancetypev1beta1.VirtualMachineClusterInstancetype{Spec: spec}

	tests := []struct {
		name         string
		wrapper      instancetypeWrapper
		wantKind     string
		wantCategory apiv2.VirtualMachineInstancetypeCategory
	}{
		{name: "cluster-scoped custom", wrapper: &customInstancetypeWrapper{cluster}, wantKind: kindVirtualMachineClusterInstancetype, wantCategory: apiv2.InstancetypeCustom},
		{name: "kubermatic standard", wrapper: &standardInstancetypeWrapper{namespaced}, wantKind: kindVirtualMachineInstancetype, wantCategory: apiv2.InstancetypeKubermatic},
		{name: "namespaced custom", wrapper: &customNamespacedInstancetypeWrapper{namespaced}, wantKind: kindVirtualMachineInstancetype, wantCategory: apiv2.InstancetypeCustom},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.wrapper.Kind(); got != tt.wantKind {
				t.Errorf("Kind() = %q, want %q", got, tt.wantKind)
			}
			if got := tt.wrapper.Category(); got != tt.wantCategory {
				t.Errorf("Category() = %q, want %q", got, tt.wantCategory)
			}
			if got := tt.wrapper.Spec(); got.CPU.Guest != spec.CPU.Guest || got.Memory.Guest != spec.Memory.Guest {
				t.Errorf("Spec() = %+v, want CPU=%d memory=%s", got, spec.CPU.Guest, spec.Memory.Guest.String())
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

// noMatchListClient wraps a Client and makes List return a NoKindMatchError for the
// object versions listed in unservedVersions, simulating a KubeVirt infra cluster that
// does not serve those API versions. errorForVersion overrides that with a real error for
// a given version (used to verify the v1alpha1 fallback propagates non-NoMatch errors).
// Everything else delegates to the wrapped client.
type noMatchListClient struct {
	ctrlruntimeclient.Client
	unservedVersions map[string]bool
	errorForVersion  map[string]error
}

func (c *noMatchListClient) List(ctx context.Context, list ctrlruntimeclient.ObjectList, opts ...ctrlruntimeclient.ListOption) error {
	gvks, _, err := c.Scheme().ObjectKinds(list)
	if err != nil {
		return err
	}
	for _, gvk := range gvks {
		if c.errorForVersion != nil {
			if e, ok := c.errorForVersion[gvk.Version]; ok {
				return e
			}
		}
		if c.unservedVersions[gvk.Version] {
			return &meta.NoKindMatchError{
				GroupKind:        gvk.GroupKind(),
				SearchedVersions: []string{gvk.Version},
			}
		}
	}
	return c.Client.List(ctx, list, opts...)
}

func TestListClusterInstancetypes_fallback(t *testing.T) {
	ctx := context.Background()

	// Confirm NoKindMatchError is detected as such, guarding the fallback trigger.
	nmErr := &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: "instancetype.kubevirt.io", Kind: "VirtualMachineClusterInstancetype"}, SearchedVersions: []string{"v1alpha1"}}
	if !meta.IsNoMatchError(nmErr) {
		t.Fatal("expected NoKindMatchError to satisfy meta.IsNoMatchError")
	}

	tests := []struct {
		name             string
		unservedVersions map[string]bool
		objects          []ctrlruntimeclient.Object
		wantNames        []string
		// wantCPU maps item name -> expected CPU.Guest after conversion. Asserting it on the
		// fallback case proves convertViaJSON copied the spec, not just the object name.
		wantCPU map[string]uint32
	}{
		{
			name:             "v1beta1 served: returns v1beta1 items, fallback not reached",
			unservedVersions: map[string]bool{},
			objects: []ctrlruntimeclient.Object{
				&kvinstancetypev1beta1.VirtualMachineClusterInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "beta-1"},
					Spec:       getInstancetypeSpec(4, "8Gi"),
				},
			},
			wantNames: []string{"beta-1"},
			wantCPU:   map[string]uint32{"beta-1": 4},
		},
		{
			name:             "v1beta1 not served: falls back to v1alpha1 and converts items",
			unservedVersions: map[string]bool{"v1beta1": true},
			objects: []ctrlruntimeclient.Object{
				&kvinstancetypev1alpha1.VirtualMachineClusterInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "alpha-1"},
					Spec: kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec{
						CPU:    kvinstancetypev1alpha1.CPUInstancetype{Guest: 2},
						Memory: kvinstancetypev1alpha1.MemoryInstancetype{Guest: resource.MustParse("4Gi")},
					},
				},
				&kvinstancetypev1alpha1.VirtualMachineClusterInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "alpha-2"},
					Spec: kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec{
						CPU:    kvinstancetypev1alpha1.CPUInstancetype{Guest: 8},
						Memory: kvinstancetypev1alpha1.MemoryInstancetype{Guest: resource.MustParse("16Gi")},
					},
				},
			},
			wantNames: []string{"alpha-1", "alpha-2"},
			wantCPU:   map[string]uint32{"alpha-1": 2, "alpha-2": 8},
		},
		{
			name:             "neither version served: returns empty, no error",
			unservedVersions: map[string]bool{"v1beta1": true, "v1alpha1": true},
			objects:          []ctrlruntimeclient.Object{},
			wantNames:        []string{},
		},
		{
			// v1beta1 is served but returns no objects. The fallback must NOT run: an empty
			// v1beta1 result on a v1beta1-served cluster is a normal state, not a signal to
			// try v1alpha1. Pins the documented no-empty-list-fallback semantics.
			name:             "v1beta1 served but empty: does not fall back to v1alpha1",
			unservedVersions: map[string]bool{},
			objects: []ctrlruntimeclient.Object{
				&kvinstancetypev1alpha1.VirtualMachineClusterInstancetype{
					ObjectMeta: metav1.ObjectMeta{Name: "alpha-stale"},
					Spec: kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec{
						CPU: kvinstancetypev1alpha1.CPUInstancetype{Guest: 2},
					},
				},
			},
			wantNames: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			base := newFakeClient(t, tt.objects...)
			client := &noMatchListClient{Client: base, unservedVersions: tt.unservedVersions}

			items, err := listClusterInstancetypes(ctx, client)
			if err != nil {
				t.Fatalf("listClusterInstancetypes() unexpected error: %v", err)
			}

			gotNames := make([]string, 0, len(items))
			for _, it := range items {
				gotNames = append(gotNames, it.Name)
			}

			sort.Strings(gotNames)
			if !reflect.DeepEqual(gotNames, tt.wantNames) {
				t.Errorf("listClusterInstancetypes() names = %v, want %v", gotNames, tt.wantNames)
			}

			for _, it := range items {
				if tt.wantCPU != nil {
					if want, ok := tt.wantCPU[it.Name]; !ok || it.Spec.CPU.Guest != want {
						t.Errorf("item %q CPU.Guest = %d, want %d", it.Name, it.Spec.CPU.Guest, want)
					}
				}
			}
		})
	}
}

// Test_listClusterInstancetypes_realError verifies that a non-NoMatch error from the
// v1beta1 List is propagated, never swallowed as an empty fallback result.
func Test_listClusterInstancetypes_realError(t *testing.T) {
	ctx := context.Background()
	client := &errorListClient{Client: newFakeClient(t), err: fmt.Errorf("connection refused")}

	if _, err := listClusterInstancetypes(ctx, client); err == nil {
		t.Fatal("expected a real (non-NoMatch) error to propagate, got nil")
	}
}

// errorListClient returns a fixed error from every List call.
type errorListClient struct {
	ctrlruntimeclient.Client
	err error
}

func (c *errorListClient) List(_ context.Context, _ ctrlruntimeclient.ObjectList, _ ...ctrlruntimeclient.ListOption) error {
	return c.err
}

// Test_listClusterInstancetypes_fallbackRealError verifies that a non-NoMatch error from
// the v1alpha1 fallback List (after a v1beta1 NoMatch) is propagated, not swallowed as an
// empty result. This is the inner branch errorListClient cannot reach, since it errors on
// the v1beta1 List before the fallback runs.
func Test_listClusterInstancetypes_fallbackRealError(t *testing.T) {
	ctx := context.Background()
	base := newFakeClient(t)
	client := &noMatchListClient{
		Client:           base,
		unservedVersions: map[string]bool{"v1beta1": true},
		errorForVersion:  map[string]error{"v1alpha1": fmt.Errorf("rpc error: timeout")},
	}

	if _, err := listClusterInstancetypes(ctx, client); err == nil {
		t.Fatal("expected the v1alpha1 fallback's real error to propagate, got nil")
	}
}

// Test_listNamespacedInstancetypes_fallback is a minimal parity check that the namespaced
// helper shares the v1beta1-first / v1alpha1-fallback behavior of the cluster helper. The
// three are near-copies; this guards against a copy-paste divergence (wrong list type or
// convert target in one variant).
func Test_listNamespacedInstancetypes_fallback(t *testing.T) {
	ctx := context.Background()
	base := newFakeClient(t, &kvinstancetypev1alpha1.VirtualMachineInstancetype{
		ObjectMeta: metav1.ObjectMeta{Name: "ns-alpha-1", Namespace: "tenant"},
		Spec: kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec{
			CPU:    kvinstancetypev1alpha1.CPUInstancetype{Guest: 2},
			Memory: kvinstancetypev1alpha1.MemoryInstancetype{Guest: resource.MustParse("4Gi")},
		},
	})
	client := &noMatchListClient{Client: base, unservedVersions: map[string]bool{"v1beta1": true}}

	items, err := listNamespacedInstancetypes(ctx, client, ctrlruntimeclient.InNamespace("tenant"))
	if err != nil {
		t.Fatalf("listNamespacedInstancetypes() unexpected error: %v", err)
	}
	if len(items) != 1 || items[0].Name != "ns-alpha-1" {
		t.Fatalf("got %+v, want one converted item named ns-alpha-1", items)
	}
	if items[0].Spec.CPU.Guest != 2 {
		t.Errorf("converted CPU.Guest = %d, want 2", items[0].Spec.CPU.Guest)
	}
}

// Test_listClusterPreferences_fallback is the preference-variant parity check. Confirms the
// helper falls back to v1alpha1 preferences and converts them when v1beta1 is not served.
func Test_listClusterPreferences_fallback(t *testing.T) {
	ctx := context.Background()
	base := newFakeClient(t, &kvinstancetypev1alpha1.VirtualMachineClusterPreference{
		ObjectMeta: metav1.ObjectMeta{Name: "pref-alpha-1"},
		Spec: kvinstancetypev1alpha1.VirtualMachinePreferenceSpec{
			CPU: &kvinstancetypev1alpha1.CPUPreferences{
				PreferredCPUTopology: kvinstancetypev1alpha1.PreferThreads,
			},
		},
	})
	client := &noMatchListClient{Client: base, unservedVersions: map[string]bool{"v1beta1": true}}

	items, err := listClusterPreferences(ctx, client)
	if err != nil {
		t.Fatalf("listClusterPreferences() unexpected error: %v", err)
	}
	if len(items) != 1 || items[0].Name != "pref-alpha-1" {
		t.Fatalf("got %+v, want one converted preference named pref-alpha-1", items)
	}
	if items[0].Spec.CPU == nil {
		t.Errorf("converted preference CPU spec is nil; conversion did not copy the spec")
	}
}
