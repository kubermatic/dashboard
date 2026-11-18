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

	"github.com/vmware/govmomi"
	"github.com/vmware/govmomi/find"
	"github.com/vmware/govmomi/simulator"
	"github.com/vmware/govmomi/vim25/types"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
)

func TestGetResourcePoolList(t *testing.T) {
	testcases := []struct {
		name     string
		cluster  string
		expected []string
	}{
		{
			name:    "without a configured cluster the resource pools of the whole datacenter are listed, sorted by path",
			cluster: "",
			expected: []string{
				"/DC0/host/DC0_C0/Resources",
				"/DC0/host/DC0_C0/Resources/DC0_C0_RP1",
				"/DC0/host/DC0_C0/Resources/DC0_C0_RP2",
				"/DC0/host/DC0_C1/Resources",
				"/DC0/host/DC0_C1/Resources/DC0_C1_RP1",
				"/DC0/host/DC0_C1/Resources/DC0_C1_RP2",
				"/DC0/host/DC0_H0/Resources",
			},
		},
		{
			name:    "with a configured cluster only the resource pools of this cluster are listed",
			cluster: "DC0_C0",
			expected: []string{
				"/DC0/host/DC0_C0/Resources",
				"/DC0/host/DC0_C0/Resources/DC0_C0_RP1",
				"/DC0/host/DC0_C0/Resources/DC0_C0_RP2",
			},
		},
		{
			name:     "an unknown cluster results in an empty list and no error",
			cluster:  "does-not-exist",
			expected: nil,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			model := simulator.VPX()
			model.Cluster = 2
			model.Pool = 2

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
				Cluster:    tc.cluster,
			}

			resourcePools, err := GetResourcePoolList(context.Background(), dc, username, password, nil)
			if err != nil {
				t.Fatalf("GetResourcePoolList failed: %v", err)
			}

			var got []string
			for _, resourcePool := range resourcePools {
				got = append(got, resourcePool.InventoryPath)
			}

			if strings.Join(got, ",") != strings.Join(tc.expected, ",") {
				t.Errorf("expected resource pools %v, got %v", tc.expected, got)
			}
		})
	}
}

// A cluster can be located in a folder below the host folder of the datacenter, the cluster of
// the datacenter spec is then configured with the path relative to the host folder.
func TestGetResourcePoolListWithClusterInFolder(t *testing.T) {
	model := simulator.VPX()
	model.Cluster = 2
	model.Pool = 1

	if err := model.Create(); err != nil {
		t.Fatalf("failed to create the simulated vCenter: %v", err)
	}
	defer model.Remove()

	server := model.Service.NewServer()
	defer server.Close()

	ctx := context.Background()
	username := simulator.DefaultLogin.Username()
	password, _ := simulator.DefaultLogin.Password()

	// create the cluster team-c in the folder team-a of the host folder, with one resource pool
	client, err := govmomi.NewClient(ctx, server.URL, true)
	if err != nil {
		t.Fatalf("failed to connect to the simulated vCenter: %v", err)
	}
	defer func() { _ = client.Logout(ctx) }()

	finder := find.NewFinder(client.Client)
	datacenter, err := finder.Datacenter(ctx, "DC0")
	if err != nil {
		t.Fatalf("failed to find the datacenter: %v", err)
	}
	finder.SetDatacenter(datacenter)

	folders, err := datacenter.Folders(ctx)
	if err != nil {
		t.Fatalf("failed to get the datacenter folders: %v", err)
	}
	folder, err := folders.HostFolder.CreateFolder(ctx, "team-a")
	if err != nil {
		t.Fatalf("failed to create the folder: %v", err)
	}
	cluster, err := folder.CreateCluster(ctx, "team-c", types.ClusterConfigSpecEx{})
	if err != nil {
		t.Fatalf("failed to create the cluster: %v", err)
	}
	rootPool, err := cluster.ResourcePool(ctx)
	if err != nil {
		t.Fatalf("failed to get the root resource pool: %v", err)
	}
	if _, err := rootPool.Create(ctx, "team-c-rp1", types.DefaultResourceConfigSpec()); err != nil {
		t.Fatalf("failed to create the resource pool: %v", err)
	}

	dc := &kubermaticv1.DatacenterSpecVSphere{
		Endpoint:   strings.TrimSuffix(server.URL.String(), "/sdk"),
		Datacenter: "DC0",
		Cluster:    "team-a/team-c",
	}

	resourcePools, err := GetResourcePoolList(ctx, dc, username, password, nil)
	if err != nil {
		t.Fatalf("GetResourcePoolList failed: %v", err)
	}

	var got []string
	for _, resourcePool := range resourcePools {
		got = append(got, resourcePool.InventoryPath)
	}

	expected := []string{
		"/DC0/host/team-a/team-c/Resources",
		"/DC0/host/team-a/team-c/Resources/team-c-rp1",
	}
	if strings.Join(got, ",") != strings.Join(expected, ",") {
		t.Errorf("expected resource pools %v, got %v", expected, got)
	}
}
