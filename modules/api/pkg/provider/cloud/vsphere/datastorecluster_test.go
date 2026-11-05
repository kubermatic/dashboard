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

package vsphere

import (
	"context"
	"strings"
	"testing"

	"github.com/vmware/govmomi/simulator"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
)

func TestGetDatastoreClusterList(t *testing.T) {
	testcases := []struct {
		name string
		// number of datastore clusters (storage pods) created in the simulated datacenter
		datastoreClusters int
		expected          []string
	}{
		{
			name:              "no datastore cluster results in an empty list and no error",
			datastoreClusters: 0,
			expected:          nil,
		},
		{
			name:              "datastore clusters are listed with their inventory path",
			datastoreClusters: 2,
			expected:          []string{"/DC0/datastore/DC0_POD0", "/DC0/datastore/DC0_POD1"},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			model := simulator.VPX()
			model.Pod = tc.datastoreClusters

			if err := model.Create(); err != nil {
				t.Fatalf("failed to create the simulated vCenter: %v", err)
			}
			defer model.Remove()

			server := model.Service.NewServer()
			defer server.Close()

			username := simulator.DefaultLogin.Username()
			password, _ := simulator.DefaultLogin.Password()

			dc := &kubermaticv1.DatacenterSpecVSphere{
				Endpoint:   strings.TrimSuffix(server.URL.String(), "/sdk"),
				Datacenter: "DC0",
			}

			datastoreClusters, err := GetDatastoreClusterList(context.Background(), dc, username, password, nil)
			if err != nil {
				t.Fatalf("GetDatastoreClusterList failed: %v", err)
			}

			var got []string
			for _, datastoreCluster := range datastoreClusters {
				got = append(got, datastoreCluster.InventoryPath)
			}

			if strings.Join(got, ",") != strings.Join(tc.expected, ",") {
				t.Errorf("expected datastore clusters %v, got %v", tc.expected, got)
			}
		})
	}
}
