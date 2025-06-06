/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

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

package common

import (
	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/v1/label"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	corev1 "k8s.io/api/core/v1"
)

func ConvertInternalSSHKeysToExternal(internalKeys []*kubermaticv1.UserSSHKey) []*apiv1.SSHKey {
	apiKeys := make([]*apiv1.SSHKey, len(internalKeys))
	for index, key := range internalKeys {
		apiKey := &apiv1.SSHKey{
			ObjectMeta: apiv1.ObjectMeta{
				ID:                key.Name,
				Name:              key.Spec.Name,
				CreationTimestamp: apiv1.NewTime(key.CreationTimestamp.Time),
				DeletionTimestamp: func() *apiv1.Time {
					if key.DeletionTimestamp != nil {
						deletionTimestamp := apiv1.NewTime(key.DeletionTimestamp.Time)
						return &deletionTimestamp
					}
					return nil
				}(),
			},
			Spec: apiv1.SSHKeySpec{
				Fingerprint: key.Spec.Fingerprint,
				PublicKey:   key.Spec.PublicKey,
			},
		}
		apiKeys[index] = apiKey
	}
	return apiKeys
}

// ConvertInternalEventToExternal converts Kubernetes Events to Kubermatic ones (used in the API).
func ConvertInternalEventToExternal(event corev1.Event) apiv1.Event {
	switch event.InvolvedObject.Kind {
	case "Machine":
		event.InvolvedObject.Kind = "Node"
	case "MachineSet":
		event.InvolvedObject.Kind = "Node Set"
	case "MachineDeployment":
		event.InvolvedObject.Kind = "Node Deployment"
	}

	return apiv1.Event{
		ObjectMeta: apiv1.ObjectMeta{
			ID:                string(event.UID),
			Name:              event.Name,
			CreationTimestamp: apiv1.NewTime(event.CreationTimestamp.Time),
		},
		Message: event.Message,
		Type:    event.Type,
		InvolvedObject: apiv1.ObjectReferenceResource{
			Name:      event.InvolvedObject.Name,
			Namespace: event.InvolvedObject.Namespace,
			Type:      event.InvolvedObject.Kind,
		},
		LastTimestamp: apiv1.NewTime(event.LastTimestamp.Time),
		Count:         event.Count,
	}
}

func ConvertInternalProjectToExternal(kubermaticProject *kubermaticv1.Project, projectOwners []apiv1.User, clustersNumber int) *apiv1.Project {
	return &apiv1.Project{
		ObjectMeta: apiv1.ObjectMeta{
			ID:                kubermaticProject.Name,
			Name:              kubermaticProject.Spec.Name,
			Annotations:       kubermaticProject.Annotations,
			CreationTimestamp: apiv1.NewTime(kubermaticProject.CreationTimestamp.Time),
			DeletionTimestamp: func() *apiv1.Time {
				if kubermaticProject.DeletionTimestamp != nil {
					dt := apiv1.NewTime(kubermaticProject.DeletionTimestamp.Time)
					return &dt
				}
				return nil
			}(),
		},
		Spec: apiv1.ProjectSpec{
			AllowedOperatingSystems: kubermaticProject.Spec.AllowedOperatingSystems,
		},
		Labels:         label.FilterLabels(label.ProjectResourceType, kubermaticProject.Labels),
		Status:         string(kubermaticProject.Status.Phase),
		Owners:         projectOwners,
		ClustersNumber: clustersNumber,
	}
}
