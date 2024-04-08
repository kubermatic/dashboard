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

package reconciling

import (
	"context"
	"fmt"

	"k8c.io/reconciler/pkg/reconciling"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"

	instancetypev1alpha1 "kubevirt.io/api/instancetype/v1alpha1"
)

// VirtualMachineInstancetypeReconciler defines an interface to create/update VirtualMachineInstancetypes.
type VirtualMachineInstancetypeReconciler = func(existing *instancetypev1alpha1.VirtualMachineInstancetype) (*instancetypev1alpha1.VirtualMachineInstancetype, error)

// NamedVirtualMachineInstancetypeReconcilerFactory returns the name of the resource and the corresponding Reconciler function.
type NamedVirtualMachineInstancetypeReconcilerFactory = func() (name string, reconciler VirtualMachineInstancetypeReconciler)

// VirtualMachineInstancetypeObjectWrapper adds a wrapper so the VirtualMachineInstancetypeReconciler matches ObjectReconciler.
// This is needed as Go does not support function interface matching.
func VirtualMachineInstancetypeObjectWrapper(reconciler VirtualMachineInstancetypeReconciler) reconciling.ObjectReconciler {
	return func(existing ctrlruntimeclient.Object) (ctrlruntimeclient.Object, error) {
		if existing != nil {
			return reconciler(existing.(*instancetypev1alpha1.VirtualMachineInstancetype))
		}
		return reconciler(&instancetypev1alpha1.VirtualMachineInstancetype{})
	}
}

// ReconcileVirtualMachineInstancetypes will create and update the VirtualMachineInstancetypes coming from the passed VirtualMachineInstancetypeReconciler slice.
func ReconcileVirtualMachineInstancetypes(ctx context.Context, namedFactories []NamedVirtualMachineInstancetypeReconcilerFactory, namespace string, client ctrlruntimeclient.Client, objectModifiers ...reconciling.ObjectModifier) error {
	for _, factory := range namedFactories {
		name, reconciler := factory()
		reconcileObject := VirtualMachineInstancetypeObjectWrapper(reconciler)
		reconcileObject = reconciling.CreateWithNamespace(reconcileObject, namespace)
		reconcileObject = reconciling.CreateWithName(reconcileObject, name)

		for _, objectModifier := range objectModifiers {
			reconcileObject = objectModifier(reconcileObject)
		}

		if err := reconciling.EnsureNamedObject(ctx, types.NamespacedName{Namespace: namespace, Name: name}, reconcileObject, client, &instancetypev1alpha1.VirtualMachineInstancetype{}, false); err != nil {
			return fmt.Errorf("failed to ensure VirtualMachineInstancetype %s/%s: %w", namespace, name, err)
		}
	}

	return nil
}

// VirtualMachinePreferenceReconciler defines an interface to create/update VirtualMachinePreferences.
type VirtualMachinePreferenceReconciler = func(existing *instancetypev1alpha1.VirtualMachinePreference) (*instancetypev1alpha1.VirtualMachinePreference, error)

// NamedVirtualMachinePreferenceReconcilerFactory returns the name of the resource and the corresponding Reconciler function.
type NamedVirtualMachinePreferenceReconcilerFactory = func() (name string, reconciler VirtualMachinePreferenceReconciler)

// VirtualMachinePreferenceObjectWrapper adds a wrapper so the VirtualMachinePreferenceReconciler matches ObjectReconciler.
// This is needed as Go does not support function interface matching.
func VirtualMachinePreferenceObjectWrapper(reconciler VirtualMachinePreferenceReconciler) reconciling.ObjectReconciler {
	return func(existing ctrlruntimeclient.Object) (ctrlruntimeclient.Object, error) {
		if existing != nil {
			return reconciler(existing.(*instancetypev1alpha1.VirtualMachinePreference))
		}
		return reconciler(&instancetypev1alpha1.VirtualMachinePreference{})
	}
}

// ReconcileVirtualMachinePreferences will create and update the VirtualMachinePreferences coming from the passed VirtualMachinePreferenceReconciler slice.
func ReconcileVirtualMachinePreferences(ctx context.Context, namedFactories []NamedVirtualMachinePreferenceReconcilerFactory, namespace string, client ctrlruntimeclient.Client, objectModifiers ...reconciling.ObjectModifier) error {
	for _, factory := range namedFactories {
		name, reconciler := factory()
		reconcileObject := VirtualMachinePreferenceObjectWrapper(reconciler)
		reconcileObject = reconciling.CreateWithNamespace(reconcileObject, namespace)
		reconcileObject = reconciling.CreateWithName(reconcileObject, name)

		for _, objectModifier := range objectModifiers {
			reconcileObject = objectModifier(reconcileObject)
		}

		if err := reconciling.EnsureNamedObject(ctx, types.NamespacedName{Namespace: namespace, Name: name}, reconcileObject, client, &instancetypev1alpha1.VirtualMachinePreference{}, false); err != nil {
			return fmt.Errorf("failed to ensure VirtualMachinePreference %s/%s: %w", namespace, name, err)
		}
	}

	return nil
}
