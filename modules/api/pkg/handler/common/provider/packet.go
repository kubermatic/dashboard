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

package provider

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/equinix/equinix-sdk-go/services/metalv1"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/dc"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/cloud/packet"
	kubernetesprovider "k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

func PacketSizesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, settingsProvider provider.SettingsProvider, projectID, clusterID string) (interface{}, error) {
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)
	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return nil, err
	}
	if cluster.Spec.Cloud.Packet == nil {
		return nil, utilerrors.NewNotFound("cloud spec for ", clusterID)
	}

	assertedClusterProvider, ok := clusterProvider.(*kubernetesprovider.ClusterProvider)
	if !ok {
		return nil, utilerrors.New(http.StatusInternalServerError, "clusterprovider is not a kubernetesprovider.Clusterprovider")
	}
	secretKeySelector := provider.SecretKeySelectorValueFuncFactory(ctx, assertedClusterProvider.GetSeedClusterAdminRuntimeClient())
	apiKey, projectID, err := packet.GetCredentialsForCluster(cluster.Spec.Cloud, secretKeySelector)
	if err != nil {
		return nil, err
	}

	settings, err := settingsProvider.GetGlobalSettings(ctx)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	datacenter, err := dc.GetDatacenter(userInfo, seedsGetter, cluster.Spec.Cloud.DatacenterName)
	if err != nil {
		return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
	}

	if datacenter.Spec.Packet == nil {
		return nil, utilerrors.NewNotFound("cloud spec (dc) for ", clusterID)
	}

	filter := handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)

	return PacketSizes(ctx, apiKey, projectID, filter)
}

func PacketSizes(ctx context.Context, apiKey, projectID string, machineFilter kubermaticv1.MachineFlavorFilter) (apiv1.PacketSizeList, error) {
	sizes := apiv1.PacketSizeList{}

	if len(apiKey) == 0 {
		return sizes, fmt.Errorf("missing required parameter: apiKey")
	}

	if len(projectID) == 0 {
		return sizes, fmt.Errorf("missing required parameter: projectID")
	}

	client := packet.GetClient(apiKey)
	request := client.PlansApi.FindPlansByProject(ctx, projectID)

	plans, response, err := client.PlansApi.FindPlansByProjectExecute(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	for _, plan := range plans.Plans {
		sizes = append(sizes, toPacketSize(plan))
	}

	return filterMachineFlavorsForPacket(sizes, machineFilter), nil
}

func filterMachineFlavorsForPacket(instances apiv1.PacketSizeList, machineFilter kubermaticv1.MachineFlavorFilter) apiv1.PacketSizeList {
	filteredRecords := apiv1.PacketSizeList{}

	// Range over the records and apply all the filters to each record.
	// If the record passes all the filters, add it to the final slice.
	for _, r := range instances {
		keep := true

		memoryGB := strings.TrimSuffix(r.Memory, "GB")
		memory, err := strconv.Atoi(memoryGB)
		if err == nil {
			if !handlercommon.FilterCPU(r.CPUs[0].Count, machineFilter.MinCPU, machineFilter.MaxCPU) {
				keep = false
			}

			if !handlercommon.FilterMemory(memory, machineFilter.MinRAM, machineFilter.MaxRAM) {
				keep = false
			}

			if keep {
				filteredRecords = append(filteredRecords, r)
			}
		}
	}

	return filteredRecords
}

func toPacketSize(plan metalv1.Plan) apiv1.PacketSize {
	drives := make([]apiv1.PacketDrive, 0)
	for _, drive := range plan.Specs.Drives {
		count := *drive.Count

		drives = append(drives, apiv1.PacketDrive{
			Count: int(count),
			Size:  *drive.Size,
			Type:  *drive.Type,
		})
	}

	memory := "N/A"
	if plan.Specs.Memory != nil {
		memory = *plan.Specs.Memory.Total
	}

	cpus := make([]apiv1.PacketCPU, 0)
	for _, cpu := range plan.Specs.Cpus {
		count := *cpu.Count

		cpus = append(cpus, apiv1.PacketCPU{
			Count: int(count),
			Type:  *cpu.Type,
		})
	}

	return apiv1.PacketSize{
		Name:   *plan.Name,
		CPUs:   cpus,
		Memory: memory,
		Drives: drives,
	}
}
