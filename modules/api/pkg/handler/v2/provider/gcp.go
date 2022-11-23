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

type GCPCommonReq struct {
	ServiceAccount string
	Credential     string
}

type GCPProjectCommonReq struct {
	Request   GCPCommonReq
	ProjectID string
}

type GCPVMReq struct {
	Request GCPCommonReq
	Zone    string
}

type GCPProjectVMReq struct {
	Request   GCPProjectCommonReq
	Zone      string
	ProjectID string
}

type GCPDatacenterReq struct {
	Request GCPCommonReq
	DC      string
}

type GCPProjectDatacenterReq struct {
	ProjectRequest GCPProjectCommonReq
	DC             string
}

type GCPSubnetReq struct {
	Request GCPCommonReq
	Network string
	DC      string
}

type GCPProjectSubnetReq struct {
	ProjectRequest GCPProjectCommonReq
	Network        string
	DC             string
}

type GCPMachineTypesReq struct {
	Request GCPCommonReq
	Zone    string
	DC      string
}

type GCPProjectMachineTypesReq struct {
	ProjectRequest GCPProjectCommonReq
	Zone           string
	DC             string
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

// Validate checks that ServiceAccount and Credentials aren't empty
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
	credentials := preset.Spec.GKE
	if credentials == nil {
		return "", fmt.Errorf("gke credentials not present in the preset %s", presetName)
	}
	return credentials.ServiceAccount, nil
}

func ListProjectGCPDiskTypes(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       GCPCommonReq
			zone      string
			projectID string
			sa        string
		)

		if !withProject {
			vmReq, ok := request.(GCPVMReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			zone = vmReq.Zone
			req = vmReq.Request
		} else {
			projectReq, ok := request.(GCPProjectVMReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			zone = projectReq.Zone
			projectID = projectReq.ProjectID
			req = projectReq.Request.Request
		}

		if err := req.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		sa = req.ServiceAccount
		var err error
		if len(req.Credential) > 0 {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		return providercommon.ListGCPDiskTypes(ctx, sa, zone)
	}
}

func ListProjectGCPZones(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req        GCPCommonReq
			projectID  string
			datacenter string
			sa         string
		)

		if !withProject {
			dcReq, ok := request.(GCPDatacenterReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = dcReq.Request
			datacenter = dcReq.DC
		} else {
			projectReq, ok := request.(GCPProjectDatacenterReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.ProjectRequest.ProjectID
			datacenter = projectReq.DC
			req = projectReq.ProjectRequest.Request
		}

		if err := req.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		sa = req.ServiceAccount
		var err error
		if len(req.Credential) > 0 {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, err
		}

		return providercommon.ListGCPZones(ctx, userInfo, sa, datacenter, seedGetter)
	}
}

func ListProjectGCPNetworks(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       GCPCommonReq
			projectID string
			sa        string
		)

		if !withProject {
			listReq, ok := request.(GCPProjectCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = listReq.Request
		} else {
			listReq, ok := request.(GCPCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = listReq
		}

		if err := req.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		sa = req.ServiceAccount
		var err error
		if len(req.Credential) > 0 {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		return providercommon.ListGCPNetworks(ctx, sa)
	}
}

func ListProjectGCPSubnetworks(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			datacenterName string
			projectID      string
			networkName    string
			sa             string
			req            GCPCommonReq
		)

		if !withProject {
			listReq := request.(GCPSubnetReq)

			networkName = listReq.Network
			datacenterName = listReq.DC
			req = listReq.Request
		} else {
			listReq := request.(GCPProjectSubnetReq)

			networkName = listReq.Network
			datacenterName = listReq.DC
			projectID = listReq.ProjectRequest.ProjectID
			req = listReq.ProjectRequest.Request
		}

		if err := req.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		sa = req.ServiceAccount
		if len(req.Credential) > 0 {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		return providercommon.ListGCPSubnetworks(ctx, userInfo, datacenterName, sa, networkName, seedGetter)
	}
}

func ListProjectGCPSizes(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, seedsGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       GCPCommonReq
			zone      string
			sa        string
			dc        string
			projectID string
		)

		if !withProject {
			listReq, ok := request.(GCPMachineTypesReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			sa = listReq.Request.Credential
			dc = listReq.DC
			zone = listReq.Zone
			req = listReq.Request
		} else {
			listReq, ok := request.(GCPProjectMachineTypesReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			projectID = listReq.ProjectRequest.ProjectID
			dc = listReq.DC
			zone = listReq.Zone
			req = listReq.ProjectRequest.Request
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		sa = req.ServiceAccount
		if len(req.Credential) > 0 {
			sa, err = getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
			if err != nil {
				return nil, err
			}
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		filter := *settings.Spec.MachineDeploymentVMResourceQuota
		if dc != "" {
			_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, dc)
			if err != nil {
				return nil, fmt.Errorf("error getting dc: %w", err)
			}
			filter = handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)
		}

		return providercommon.ListGCPSizes(ctx, filter, sa, zone)
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
