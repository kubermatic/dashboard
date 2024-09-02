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

package applicationinstallation

import (
	"sort"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	appskubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/apps.kubermatic/v1"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func convertInternalToAPIApplicationInstallation(in *appskubermaticv1.ApplicationInstallation) *apiv2.ApplicationInstallation {
	out := &apiv2.ApplicationInstallation{
		ObjectMeta: apiv1.ObjectMeta{
			CreationTimestamp: apiv1.Time(in.CreationTimestamp),
			Name:              in.Name,
		},
		Namespace:   in.Namespace,
		Labels:      in.Labels,
		Annotations: in.Annotations,
		Spec: &apiv2.ApplicationInstallationSpec{
			Namespace: apiv1.NamespaceSpec{
				Name:        in.Spec.Namespace.Name,
				Create:      in.Spec.Namespace.Create,
				Labels:      in.Spec.Namespace.Labels,
				Annotations: in.Spec.Namespace.Annotations,
			},
			ApplicationRef: apiv1.ApplicationRef{
				Name:    in.Spec.ApplicationRef.Name,
				Version: in.Spec.ApplicationRef.Version,
			},
			ReconciliationInterval: in.Spec.ReconciliationInterval,
			DeployOptions:          in.Spec.DeployOptions,
			Values:                 in.Spec.Values,
			ValuesBlock:            in.Spec.ValuesBlock,
		},
		Status: &apiv2.ApplicationInstallationStatus{
			ApplicationVersion: in.Status.ApplicationVersion,
			Method:             in.Status.Method,
		},
	}

	out.Status.Conditions = convertApplicationInstallationCondition(in.Status.Conditions)

	if in.DeletionTimestamp != nil {
		ts := apiv1.NewTime(in.DeletionTimestamp.Time)
		out.DeletionTimestamp = &ts
	}

	return out
}

func convertInternalToAPIApplicationInstallationForList(in *appskubermaticv1.ApplicationInstallation) *apiv2.ApplicationInstallationListItem {
	out := &apiv2.ApplicationInstallationListItem{
		Namespace:         in.Namespace,
		Name:              in.Name,
		CreationTimestamp: apiv1.Time(in.CreationTimestamp),
		Labels:            in.Labels,
		Annotations:       in.Annotations,
		Spec: &apiv2.ApplicationInstallationListItemSpec{
			Namespace: apiv1.NamespaceSpec{
				Name:        in.Spec.Namespace.Name,
				Create:      in.Spec.Namespace.Create,
				Labels:      in.Spec.Namespace.Labels,
				Annotations: in.Spec.Namespace.Annotations,
			},
			ApplicationRef: apiv1.ApplicationRef{
				Name:    in.Spec.ApplicationRef.Name,
				Version: in.Spec.ApplicationRef.Version,
			},
		},
		Status: &apiv2.ApplicationInstallationListItemStatus{
			Method:             in.Status.Method,
			ApplicationVersion: in.Status.ApplicationVersion,
		},
	}

	out.Status.Conditions = convertApplicationInstallationCondition(in.Status.Conditions)

	return out
}

func convertAPItoInternalApplicationInstallationBody(app *apiv2.ApplicationInstallationBody) *appskubermaticv1.ApplicationInstallation {
	return &appskubermaticv1.ApplicationInstallation{
		TypeMeta: metav1.TypeMeta{
			Kind:       appskubermaticv1.ApplicationInstallationKindName,
			APIVersion: appskubermaticv1.SchemeGroupVersion.String(),
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:        app.Name,
			Namespace:   app.Namespace,
			Labels:      app.Labels,
			Annotations: app.Annotations,
		},
		Spec: appskubermaticv1.ApplicationInstallationSpec{
			Namespace: appskubermaticv1.AppNamespaceSpec{
				Name:        app.Spec.Namespace.Name,
				Create:      app.Spec.Namespace.Create,
				Labels:      app.Spec.Namespace.Labels,
				Annotations: app.Spec.Namespace.Annotations,
			},
			ApplicationRef: appskubermaticv1.ApplicationRef{
				Name:    app.Spec.ApplicationRef.Name,
				Version: app.Spec.ApplicationRef.Version,
			},
			ReconciliationInterval: app.Spec.ReconciliationInterval,
			DeployOptions:          app.Spec.DeployOptions,
			Values:                 app.Spec.Values,
			ValuesBlock:            app.Spec.ValuesBlock,
		},
	}
}

func convertApplicationInstallationCondition(conditions map[appskubermaticv1.ApplicationInstallationConditionType]appskubermaticv1.ApplicationInstallationCondition) (apiConditions []apiv2.ApplicationInstallationCondition) {
	for condType, condition := range conditions {
		apiConditions = append(apiConditions, apiv2.ApplicationInstallationCondition{
			Type:               condType,
			Status:             condition.Status,
			LastHeartbeatTime:  apiv1.NewTime(condition.LastHeartbeatTime.Time),
			LastTransitionTime: apiv1.NewTime(condition.LastTransitionTime.Time),
			Reason:             condition.Reason,
			Message:            condition.Message,
		})
	}
	// ensure a stable sorting order
	sort.Slice(apiConditions, func(i, j int) bool {
		return apiConditions[i].Type < apiConditions[j].Type
	})
	return apiConditions
}
