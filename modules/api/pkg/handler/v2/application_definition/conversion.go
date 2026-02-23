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

package applicationdefinition

import (
	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	appskubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/apps.kubermatic/v1"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func convertInternalToAPIApplicationDefinitionForList(appDef *appskubermaticv1.ApplicationDefinition) *apiv2.ApplicationDefinitionListItem {
	return &apiv2.ApplicationDefinitionListItem{
		Annotations: appDef.Annotations,
		Labels:      appDef.Labels,
		Name:        appDef.Name,
		Spec: apiv2.ApplicationDefinitionListItemSpec{
			DisplayName:      appDef.Spec.DisplayName,
			Description:      appDef.Spec.Description,
			DocumentationURL: appDef.Spec.DocumentationURL,
			SourceURL:        appDef.Spec.SourceURL,
			Logo:             appDef.Spec.Logo,
			LogoFormat:       appDef.Spec.LogoFormat,
			DefaultVersion:   appDef.Spec.DefaultVersion,
			Enforced:         appDef.Spec.Enforced,
			Default:          appDef.Spec.Default,
			Selector:         appDef.Spec.Selector,
		},
	}
}

func convertInternalToAPIApplicationDefinition(appDef *appskubermaticv1.ApplicationDefinition) *apiv2.ApplicationDefinition {
	return &apiv2.ApplicationDefinition{
		ObjectMeta: apiv1.ObjectMeta{
			CreationTimestamp: apiv1.Time(appDef.CreationTimestamp),
			Name:              appDef.Name,
			Annotations:       appDef.Annotations,
		},
		Spec:   &appDef.Spec,
		Labels: appDef.Labels,
	}
}

func convertAPItoInternalApplicationDefinitionBody(appDef *apiv2.ApplicationDefinitionBody) *appskubermaticv1.ApplicationDefinition {
	return &appskubermaticv1.ApplicationDefinition{
		TypeMeta: metav1.TypeMeta{
			Kind:       appskubermaticv1.ApplicationInstallationKindName,
			APIVersion: appskubermaticv1.SchemeGroupVersion.String(),
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:   appDef.Name,
			Labels: appDef.Labels,
		},
		Spec: appskubermaticv1.ApplicationDefinitionSpec{
			DisplayName:        appDef.Spec.DisplayName,
			Description:        appDef.Spec.Description,
			Method:             appDef.Spec.Method,
			DefaultValuesBlock: appDef.Spec.DefaultValuesBlock,
			Versions:           appDef.Spec.Versions,
			DocumentationURL:   appDef.Spec.DocumentationURL,
			SourceURL:          appDef.Spec.SourceURL,
			Logo:               appDef.Spec.Logo,
			LogoFormat:         appDef.Spec.LogoFormat,
		},
	}
}
