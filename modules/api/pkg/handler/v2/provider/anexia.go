/*
Copyright 2021 The Kubermatic Kubernetes Platform contributors.

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

	"k8s.io/utils/ptr"
)

func AnexiaProjectVlansEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(anexiaProjectReq)

		token := req.Token
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credentials := preset.Spec.Anexia; credentials != nil {
				token = credentials.Token
			}
		}

		return providercommon.ListAnexiaVlans(ctx, token)
	}
}

func AnexiaProjectTemplatesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(anexiaProjectTemplateReq)

		token := req.Token
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credentials := preset.Spec.Anexia; credentials != nil {
				token = credentials.Token
			}
		}

		return providercommon.ListAnexiaTemplates(ctx, token, req.Location)
	}
}

func AnexiaProjectDiskTypesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(anexiaProjectDiskTypeReq)

		token := req.Token
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credentials := preset.Spec.Anexia; credentials != nil {
				token = credentials.Token
			}
		}

		return providercommon.ListAnexiaDiskTypes(ctx, token, req.Location)
	}
}

func AnexiaVlansWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(anexiaNoCredentialReq)
		return providercommon.AnexiaVlansWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	}
}

func AnexiaTemplatesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(anexiaNoCredentialReq)
		return providercommon.AnexiaTemplatesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

func AnexiaDiskTypesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(anexiaNoCredentialReq)
		return providercommon.AnexiaDiskTypesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

// AnexiaReq represent a request for Anexia resources
// swagger:parameters listProjectAnexiaVlans
type anexiaProjectReq struct {
	common.ProjectReq

	// in: header
	// Token Anexia token
	Token string
	// in: header
	// Credential predefined Kubermatic credential name from the presets
	Credential string
}

func DecodeAnexiaProjectReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return anexiaProjectReq{
		ProjectReq: projectReq.(common.ProjectReq),
		Token:      r.Header.Get("Token"),
		Credential: r.Header.Get("Credential"),
	}, nil
}

// anexiaProjectTemplateReq represent a request for Anexia template resources
// swagger:parameters listProjectAnexiaTemplates
type anexiaProjectTemplateReq struct {
	anexiaProjectReq

	// in: header
	// Location Anexia location ID
	Location string
}

func DecodeAnexiaProjectTemplateReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := DecodeAnexiaProjectReq(c, r)
	if err != nil {
		return nil, err
	}

	return anexiaProjectTemplateReq{
		anexiaProjectReq: projectReq.(anexiaProjectReq),
		Location:         r.Header.Get("Location"),
	}, nil
}

// anexiaProjectDiskTypeReq represent a request for Anexia disk-type resources
// swagger:parameters listProjectAnexiaDiskTypes
type anexiaProjectDiskTypeReq struct {
	anexiaProjectReq

	// in: header
	// Location Anexia location ID
	Location string
}

func DecodeAnexiaProjectDiskTypeReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := DecodeAnexiaProjectReq(c, r)
	if err != nil {
		return nil, err
	}

	return anexiaProjectDiskTypeReq{
		anexiaProjectReq: projectReq.(anexiaProjectReq),
		Location:         r.Header.Get("Location"),
	}, nil
}

// anexiaNoCredentialReq represent a request for Anexia resources
// swagger:parameters listAnexiaVlansNoCredentialsV2 listAnexiaTemplatesNoCredentialsV2 listAnexiaDiskTypesNoCredentialsV2
type anexiaNoCredentialReq struct {
	cluster.GetClusterReq
}

// GetSeedCluster returns the SeedCluster object.
func (req anexiaNoCredentialReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeAnexiaNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req anexiaNoCredentialReq

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

	return req, nil
}
