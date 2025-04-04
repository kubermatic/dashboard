//go:build integration

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

package vsphere

import (
	"context"
	"path"
	"testing"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/util/sets"
)

func TestProvider_GetVMFolders(t *testing.T) {
	tests := []struct {
		name            string
		dc              *kubermaticv1.DatacenterSpecVSphere
		expectedFolders sets.Set[string]
	}{
		{
			name: "successfully-list-default-folders",
			dc:   getTestDC(),
			expectedFolders: sets.New(
				path.Join("/", vSphereDatacenter, "vm"),
				path.Join("/", vSphereDatacenter, "vm", "sig-infra"),
				path.Join("/", vSphereDatacenter, "vm", "Kubermatic-dev"),
			),
		},
		{
			name: "successfully-list-folders-below-custom-root",
			dc: &kubermaticv1.DatacenterSpecVSphere{
				Datacenter:    vSphereDatacenter,
				Endpoint:      vSphereEndpoint,
				AllowInsecure: true,
				RootPath:      path.Join("/", vSphereDatacenter, "vm"),
			},
			expectedFolders: sets.New(
				path.Join("/", vSphereDatacenter, "vm", "sig-infra"),
				path.Join("/", vSphereDatacenter, "vm", "Kubermatic-dev"),
			),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			folders, err := GetVMFolders(context.Background(), test.dc, vSphereUsername, vSpherePassword, nil)
			if err != nil {
				t.Fatal(err)
			}

			gotFolders := sets.New[string]()
			for _, folder := range folders {
				gotFolders.Insert(folder.Path)
			}
			t.Logf("Got folders: %v", sets.List(gotFolders))

			if test.expectedFolders.Difference(gotFolders).Len() > 0 {
				t.Fatalf("Response is missing expected folders:\n")

				// TODO: Uncomment this when SetDiff is fixed in KKP repo.
				// t.Fatalf("Response is missing expected folders:\n%v", diff.SetDiff(test.expectedFolders, gotFolders))
			}
		})
	}
}
