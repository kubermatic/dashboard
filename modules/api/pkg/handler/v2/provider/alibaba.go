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

	"k8s.io/utils/ptr"
)

// alibabaNoCredentialReq represent a request for Alibaba instance types.
// swagger:parameters listAlibabaInstanceTypesNoCredentialsV2 listAlibabaZonesNoCredentialsV2 listAlibabaVSwitchesNoCredentialsV2
type alibabaNoCredentialReq struct {
	cluster.GetClusterReq
	// in: header
	// name: Region
	Region string
}

// GetSeedCluster returns the SeedCluster object.
func (req alibabaNoCredentialReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeAlibabaNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req alibabaNoCredentialReq
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
	req.Region = r.Header.Get("Region")

	return req, nil
}

// AlibabaProjectReq represent a request for Alibaba instance types.
// swagger:parameters listProjectAlibabaZones listProjectAlibabaVSwitches
type AlibabaProjectReq struct {
	common.ProjectReq

	// in: header
	// name: AccessKeyID
	AccessKeyID string
	// in: header
	// name: AccessKeySecret
	AccessKeySecret string
	// in: header
	// name: Credential
	Credential string
	// in: header
	// name: Region
	Region string
}

// AlibabaProjectInstanceTypesReq represent a request for Alibaba instance types.
// swagger:parameters listProjectAlibabaInstanceTypes
type AlibabaProjectInstanceTypesReq struct {
	AlibabaProjectReq
	// in: header
	// DatacenterName datacenter name
	DatacenterName string
}

func DecodeAlibabaProjectReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return AlibabaProjectReq{
		ProjectReq:      projectReq.(common.ProjectReq),
		AccessKeyID:     r.Header.Get("AccessKeyID"),
		AccessKeySecret: r.Header.Get("AccessKeySecret"),
		Credential:      r.Header.Get("Credential"),
		Region:          r.Header.Get("Region"),
	}, nil
}

func DecodeAlibabaProjectInstanceTypesReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := DecodeAlibabaProjectReq(c, r)
	if err != nil {
		return nil, err
	}

	return AlibabaProjectInstanceTypesReq{
		AlibabaProjectReq: projectReq.(AlibabaProjectReq),
		DatacenterName:    r.Header.Get("DatacenterName"),
	}, nil
}

func AlibabaInstanceTypesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(alibabaNoCredentialReq)
		return providercommon.AlibabaInstanceTypesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, settingsProvider, req.ProjectID, req.ClusterID, req.Region)
	}
}

func AlibabaZonesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(alibabaNoCredentialReq)
		return providercommon.AlibabaZonesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.Region)
	}
}

func AlibabaVswitchesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(alibabaNoCredentialReq)
		return providercommon.AlibabaVswitchesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.Region)
	}
}

func AlibabaInstanceTypesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(AlibabaProjectInstanceTypesReq)

		accessKeyID := req.AccessKeyID
		accessKeySecret := req.AccessKeySecret

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}

			if credentials := preset.Spec.Alibaba; credentials != nil {
				accessKeyID = credentials.AccessKeyID
				accessKeySecret = credentials.AccessKeySecret
			}
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		filter := *settings.Spec.MachineDeploymentVMResourceQuota
		datacenterName := req.DatacenterName
		if datacenterName != "" {
			_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
			if err != nil {
				return nil, fmt.Errorf("error getting dc: %w", err)
			}

			filter = handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)
		}

		return providercommon.ListAlibabaInstanceTypes(accessKeyID, accessKeySecret, req.Region, filter)
	}
}

func AlibabaZonesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(AlibabaProjectReq)

		accessKeyID := req.AccessKeyID
		accessKeySecret := req.AccessKeySecret

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}

			if credentials := preset.Spec.Alibaba; credentials != nil {
				accessKeyID = credentials.AccessKeyID
				accessKeySecret = credentials.AccessKeySecret
			}
		}

		return providercommon.ListAlibabaZones(accessKeyID, accessKeySecret, req.Region)
	}
}

func AlibabaVSwitchesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(AlibabaProjectReq)

		accessKeyID := req.AccessKeyID
		accessKeySecret := req.AccessKeySecret

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}

			if credentials := preset.Spec.Alibaba; credentials != nil {
				accessKeyID = credentials.AccessKeyID
				accessKeySecret = credentials.AccessKeySecret
			}
		}

		return providercommon.ListAlibabaVSwitches(accessKeyID, accessKeySecret, req.Region)
	}
}
