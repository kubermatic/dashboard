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

package kubevirt

import (
	kvinstancetypev1alpha1 "kubevirt.io/api/instancetype/v1alpha1"

	kvmanifests "k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt/manifests"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

// GetKubermaticStandardInstancetypes returns the Kubermatic standard VirtualMachineInstancetypes.
func GetKubermaticStandardInstancetypes(client ctrlruntimeclient.Client, getter kvmanifests.ManifestFSGetter) []kvinstancetypev1alpha1.VirtualMachineInstancetype {
	objs := kvmanifests.RuntimeFromYaml(client, getter)
	instancetypes := make([]kvinstancetypev1alpha1.VirtualMachineInstancetype, 0, len(objs))
	for _, obj := range objs {
		instancetypes = append(instancetypes, *obj.(*kvinstancetypev1alpha1.VirtualMachineInstancetype))
	}
	return instancetypes
}
