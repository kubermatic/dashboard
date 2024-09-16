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

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

// gcpTypesNoCredentialReq represent a request for GCP machine or disk types.
// swagger:parameters listGCPSizesNoCredentialsV2 listGCPDiskTypesNoCredentialsV2
type gcpTypesNoCredentialReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
	// in: header
	// name: Zone
	Zone string
}

// GetSeedCluster returns the SeedCluster object.
func (req gcpTypesNoCredentialReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// GCPCommonReq represents a request with common parameters for GCP.
type GCPCommonReq struct {
	// in: header
	// name: ServiceAccount
	ServiceAccount string
	// in: header
	// name: Credential
	Credential string
}

// GCPProjectCommonReq represents a project based request.
// swagger:parameters listProjectGCPNetworks
type GCPProjectCommonReq struct {
	GCPCommonReq
	common.ProjectReq
}

// gcpSubnetworksNoCredentialReq represent a request for GCP subnetworks.
// swagger:parameters listGCPSubnetworksNoCredentialsV2
type gcpSubnetworksNoCredentialReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
	// in: header
	// name: Network
	Network string
}

// GCPProjectVMReq represents a request for GCP Disktypes within the context of a KKP project.
// swagger:parameters listProjectGCPDiskTypes
type GCPProjectVMReq struct {
	GCPProjectCommonReq
	Zone string
}

// GCPProjectDatacenterReq represents a request for GCP datacenters within the context of a KKP project.
// swagger:parameters listProjectGCPZones
type GCPProjectDatacenterReq struct {
	GCPProjectCommonReq

	// KKP Datacenter to use for endpoint
	// in: path
	// required: true
	DC string `json:"dc"`
}

// GCPProjectSubnetReq represents a request for GCP subnets within the context of a KKP project.
// swagger:parameters listProjectGCPSubnetworks
type GCPProjectSubnetReq struct {
	GCPProjectCommonReq
	Network string

	// KKP Datacenter to use for endpoint
	// in: path
	// required: true
	DC string `json:"dc"`
}

// GCPProjectMachineTypesReq represents a request for GCP machine types within the context of a KKP project.
// swagger:parameters listProjectGCPVMSizes
type GCPProjectMachineTypesReq struct {
	GCPProjectCommonReq
	Zone string
	DC   string
}

// GetSeedCluster returns the SeedCluster object.
func (req gcpSubnetworksNoCredentialReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeGCPTypesNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req gcpTypesNoCredentialReq
	clusterID, err := common.DecodeClusterID(c, r)
	if err != nil {
		return nil, err
	}

	req.ClusterID = clusterID

	pr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	req.Zone = r.Header.Get("Zone")

	return req, nil
}

func DecodeGCPSubnetworksNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req gcpSubnetworksNoCredentialReq
	clusterID, err := common.DecodeClusterID(c, r)
	if err != nil {
		return nil, err
	}

	req.ClusterID = clusterID

	pr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = pr.(common.ProjectReq)
	req.Network = r.Header.Get("Network")

	return req, nil
}

func decodeGCPCommonReq(c context.Context, r *http.Request) (interface{}, error) {
	var req GCPCommonReq

	req.ServiceAccount = r.Header.Get("ServiceAccount")
	req.Credential = r.Header.Get("Credential")

	return req, nil
}

func DecodeProjectGCPCommonReq(c context.Context, r *http.Request) (interface{}, error) {
	var req GCPProjectCommonReq

	commonReq, err := decodeGCPCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GCPCommonReq = commonReq.(GCPCommonReq)

	project, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = project.(common.ProjectReq)

	return req, nil
}

func DecodeProjectGCPDisktypes(c context.Context, r *http.Request) (interface{}, error) {
	var req GCPProjectVMReq

	project, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = project.(common.ProjectReq)

	commonReq, err := decodeGCPCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GCPCommonReq = commonReq.(GCPCommonReq)

	req.Zone = r.Header.Get("Zone")

	return req, nil
}

func DecodeProjectGCPSubnetworks(c context.Context, r *http.Request) (interface{}, error) {
	var req GCPProjectSubnetReq

	project, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = project.(common.ProjectReq)

	commonReq, err := decodeGCPCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GCPCommonReq = commonReq.(GCPCommonReq)

	req.DC = r.Header.Get("DatacenterName")
	if req.DC == "" {
		req.DC = mux.Vars(r)["dc"]
	}
	if req.DC == "" {
		return nil, fmt.Errorf("datacenter is required")
	}

	req.Network = r.Header.Get("Network")
	return req, nil
}

func DecodeProjectGCPZones(c context.Context, r *http.Request) (interface{}, error) {
	var req GCPProjectDatacenterReq

	project, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = project.(common.ProjectReq)

	commonReq, err := decodeGCPCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GCPCommonReq = commonReq.(GCPCommonReq)

	req.DC = r.Header.Get("DatacenterName")
	if req.DC == "" {
		req.DC = mux.Vars(r)["dc"]
	}
	if req.DC == "" {
		return nil, fmt.Errorf("datacenter is required")
	}

	return req, nil
}

func DecodeProjectGCPVMSizes(c context.Context, r *http.Request) (interface{}, error) {
	var req GCPProjectMachineTypesReq

	project, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = project.(common.ProjectReq)

	commonReq, err := decodeGCPCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GCPCommonReq = commonReq.(GCPCommonReq)

	req.DC = r.Header.Get("DatacenterName")
	req.Zone = r.Header.Get("Zone")

	return req, nil
}

// Validate checks that ServiceAccount and Credentials aren't empty.
func (req GCPCommonReq) Validate() error {
	if len(req.ServiceAccount) == 0 && len(req.Credential) == 0 {
		return fmt.Errorf("GCP credentials cannot be empty")
	}
	return nil
}

func getSAFromPreset(ctx context.Context,
	userInfoGetter provider.UserInfoGetter,
	presetProvider provider.PresetProvider,
	presetName string,
	projectID string,
) (string, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return "", common.KubernetesErrorToHTTPError(err)
	}
	preset, err := presetProvider.GetPreset(ctx, userInfo, &projectID, presetName)
	if err != nil {
		return "", utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", presetName, userInfo.Email))
	}
	credentials := preset.Spec.GCP
	if credentials == nil {
		return "", fmt.Errorf("gcp credentials not present in the preset %s", presetName)
	}
	return credentials.ServiceAccount, nil
}

func ListProjectGCPDiskTypes(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		listReq, ok := request.(GCPProjectVMReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		var err error
		if err = listReq.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		sa := listReq.ServiceAccount
		if listReq.Credential != "" {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, listReq.Credential, listReq.GetProjectID())
			if err != nil {
				return nil, err
			}
		}

		return providercommon.ListGCPDiskTypes(ctx, sa, listReq.Zone)
	}
}

func ListProjectGCPZones(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		projectReq, ok := request.(GCPProjectDatacenterReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		var err error
		if err = projectReq.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		projectID := projectReq.GetProjectID()
		sa := projectReq.ServiceAccount
		if projectReq.Credential != "" {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, projectReq.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, err
		}

		return providercommon.ListGCPZones(ctx, userInfo, sa, projectReq.DC, seedGetter)
	}
}

func ListProjectGCPNetworks(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		listReq, ok := request.(GCPProjectCommonReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		var err error

		if err = listReq.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		sa := listReq.ServiceAccount
		if listReq.Credential != "" {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, listReq.Credential, listReq.GetProjectID())
			if err != nil {
				return nil, err
			}
		}

		return providercommon.ListGCPNetworks(ctx, sa)
	}
}

func ListProjectGCPSubnetworks(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		listReq := request.(GCPProjectSubnetReq)

		var err error
		if err = listReq.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		projectID := listReq.GetProjectID()
		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		sa := listReq.ServiceAccount
		if listReq.Credential != "" {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, listReq.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		return providercommon.ListGCPSubnetworks(ctx, userInfo, listReq.DC, sa, listReq.Network, seedGetter)
	}
}

func ListProjectGCPVMSizes(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		listReq, ok := request.(GCPProjectMachineTypesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		projectID := listReq.GetProjectID()

		err := listReq.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		sa := listReq.ServiceAccount
		if listReq.Credential != "" {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, listReq.Credential, listReq.GetProjectID())
			if err != nil {
				return nil, err
			}
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		filter := *settings.Spec.MachineDeploymentVMResourceQuota
		if listReq.DC != "" {
			_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, listReq.DC)
			if err != nil {
				return nil, fmt.Errorf("error getting dc: %w", err)
			}
			filter = handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)
		}

		return providercommon.ListGCPSizes(ctx, filter, sa, listReq.Zone)
	}
}

func GCPDiskTypesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(gcpTypesNoCredentialReq)
		return providercommon.GCPDiskTypesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID, req.Zone)
	}
}

func GCPSizeWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(gcpTypesNoCredentialReq)
		return providercommon.GCPSizeWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, settingsProvider, req.ProjectID, req.ClusterID, req.Zone)
	}
}

func GCPZoneWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(cluster.GetClusterReq)
		return providercommon.GCPZoneWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

func GCPNetworkWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(cluster.GetClusterReq)
		return providercommon.GCPNetworkWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	}
}

func GCPSubnetworkWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(gcpSubnetworksNoCredentialReq)
		return providercommon.GCPSubnetworkWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.Network)
	}
}
