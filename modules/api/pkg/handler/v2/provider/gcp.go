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
	Common    GCPCommonReq
	ProjectID string
}

type GCPVMReq struct {
	Common GCPCommonReq
	Zone   string
}

type GCPProjectVMReq struct {
	GCPVMReq  GCPVMReq
	ProjectId string
}

type GCPDCReq struct {
	Common GCPCommonReq
	DC     string
}

type GCPProjectDCReq struct {
	ProjectReq GCPProjectCommonReq
	DC         string
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

// Validate validates GCP request.
func (req GCPCommonReq) Validate() error {
	if len(req.ServiceAccount) == 0 && len(req.Credential) == 0 {
		return fmt.Errorf("GCP credentials cannot be empty")
	}
	return nil
}

func (req GCPVMReq) Validate() error {
	if len(req.Zone) == 0 {
		return fmt.Errorf("GCP zone cannot be empty")
	}
	return req.Common.Validate()
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
			req       GCPVMReq
			projectID string
		)

		if !withProject {
			vmReq, ok := request.(GCPVMReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = vmReq
		} else {
			projectReq, ok := request.(GCPProjectVMReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.ProjectId
			req = projectReq.GCPVMReq
		}
		if err := req.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		sa, err := getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Common.Credential, projectID)
		if err != nil {
			return nil, err
		}

		return providercommon.ListGCPDiskTypes(ctx, sa, req.Zone)
	}
}

func ListProjectGCPZones(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req        GCPCommonReq
			projectID  string
			datacenter string
		)

		if !withProject {
			dcReq, ok := request.(GCPDCReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = dcReq.Common
			datacenter = dcReq.DC
		} else {
			projectReq, ok := request.(GCPProjectDCReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.ProjectReq.ProjectID
			datacenter = projectReq.DC
			req = projectReq.ProjectReq.Common
		}

		if err := req.Validate(); err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		sa, err := getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
		if err != nil {
			return nil, err
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, err
		}

		return providercommon.ListGCPZones(ctx, userInfo, sa, datacenter, seedGetter)
	}
}

func ListProjectGCPNetworks(userInfoGetter provider.UserInfoGetter, presetProvider provider.PresetProvider, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       GCPCommonReq
			projectID string
		)

		if !withProject {
			listReq, ok := request.(GCPProjectCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			projectID = listReq.ProjectID
			req = listReq.Common
		} else {
			listReq, ok := request.(GCPCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = listReq
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		sa, err := getSAFromPreset(ctx, userInfoGetter, presetProvider, req.Credential, projectID)
		if err != nil {
			return nil, err
		}

		return providercommon.ListGCPNetworks(ctx, sa)
	}
}

func ListGCPSubnetworks(ctx context.Context, userInfo *provider.UserInfo, datacenterName string, networkName string, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return nil, nil
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
