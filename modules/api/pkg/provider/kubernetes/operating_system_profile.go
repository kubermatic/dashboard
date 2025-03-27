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

package kubernetes

import (
	"context"
	"fmt"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	osmv1alpha1 "k8c.io/operating-system-manager/pkg/crd/osm/v1alpha1"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

// PrivilegedOperatingSystemProfileProvider struct that holds required components of the PrivilegedOperatingSystemProfileProvider.
type PrivilegedOperatingSystemProfileProvider struct {
	privilegedClient ctrlruntimeclient.Client
	namespace        string
}

var _ provider.PrivilegedOperatingSystemProfileProvider = &PrivilegedOperatingSystemProfileProvider{}

// NewPrivilegedOperatingSystemProfileProvider returns a new PrivilegedOperatingSystemProfileProvider.
func NewPrivilegedOperatingSystemProfileProvider(privilegedClient ctrlruntimeclient.Client, namespace string) *PrivilegedOperatingSystemProfileProvider {
	return &PrivilegedOperatingSystemProfileProvider{
		privilegedClient: privilegedClient,
		namespace:        namespace,
	}
}

// ListUnsecured lists available OSPs from seed namespace.
func (p *PrivilegedOperatingSystemProfileProvider) ListUnsecured(ctx context.Context) (*osmv1alpha1.OperatingSystemProfileList, error) {
	ospList := &unstructured.UnstructuredList{}
	ospList.SetAPIVersion("operatingsystemmanager.k8c.io/v1alpha1")
	ospList.SetKind("CustomOperatingSystemProfileList")

	if err := p.privilegedClient.List(ctx, ospList, &ctrlruntimeclient.ListOptions{Namespace: p.namespace}); err != nil {
		return nil, err
	}

	res := &osmv1alpha1.OperatingSystemProfileList{}
	for _, customOSP := range ospList.Items {
		osp, err := customOSPToOSP(&customOSP)
		if err != nil {
			return nil, err
		}

		res.Items = append(res.Items, *osp)
	}

	return res, nil
}

func PrivilegedOperatingSystemProfileProviderFactory(mapper meta.RESTMapper, seedKubeconfigGetter provider.SeedKubeconfigGetter) provider.PrivilegedOperatingSystemProfileProviderGetter {
	return func(seed *kubermaticv1.Seed) (provider.PrivilegedOperatingSystemProfileProvider, error) {
		cfg, err := seedKubeconfigGetter(seed)
		if err != nil {
			return nil, err
		}
		privilegedClient, err := ctrlruntimeclient.New(cfg, ctrlruntimeclient.Options{Mapper: mapper})
		if err != nil {
			return nil, err
		}
		return NewPrivilegedOperatingSystemProfileProvider(
			privilegedClient,
			seed.Namespace,
		), nil
	}
}

func customOSPToOSP(u *unstructured.Unstructured) (*osmv1alpha1.OperatingSystemProfile, error) {
	osp := &osmv1alpha1.OperatingSystemProfile{}
	// Required for converting CustomOperatingSystemProfile to OperatingSystemProfile.
	obj := u.DeepCopy()
	obj.SetKind("OperatingSystemProfile")
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(obj.Object, osp); err != nil {
		return osp, fmt.Errorf("failed to decode CustomOperatingSystemProfile: %w", err)
	}
	return osp, nil
}
