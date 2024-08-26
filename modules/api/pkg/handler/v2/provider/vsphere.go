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
	"crypto/x509"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/ptr"
)

func VsphereNetworksWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(vSphereNoCredentialsReq)
		return providercommon.VsphereNetworksWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func VsphereFoldersWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(vSphereNoCredentialsReq)
		return providercommon.VsphereFoldersWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func VsphereTagCategoriesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(vSphereNoCredentialsReq)
		return providercommon.VsphereTagCategoriesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func VsphereTagsForTagCategoryWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(vSphereTagsNoCredentialsReq)
		return providercommon.VSphereTagsForTagCategoryWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.TagCategory, caBundle)
	}
}

func VsphereDatastoreEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       vSphereCommonReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(vSphereCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = commonReq
		} else {
			projectReq, ok := request.(vSphereProjectReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = projectReq.vSphereCommonReq
			projectID = projectReq.GetProjectID()
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		username := req.Username
		password := req.Password

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(projectID), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}

			if credentials := preset.Spec.VSphere; credentials != nil {
				username = credentials.Username
				password = credentials.Password
			}
		}

		return providercommon.GetVsphereDatastoreList(ctx, userInfo, seedsGetter, username, password, req.DatacenterName, caBundle)
	}
}

func VsphereVMGroupEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       vSphereCommonReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(vSphereCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = commonReq
		} else {
			projectReq, ok := request.(vSphereProjectReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = projectReq.vSphereCommonReq
			projectID = projectReq.GetProjectID()
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		username := req.Username
		password := req.Password

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(projectID), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}

			if credentials := preset.Spec.VSphere; credentials != nil {
				username = credentials.Username
				password = credentials.Password
			}
		}

		return providercommon.GetVsphereVMGroupsList(ctx, userInfo, seedsGetter, username, password, req.DatacenterName, caBundle)
	}
}

func VsphereNetworksEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(vSphereProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		username := req.Username
		password := req.Password

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credentials := preset.Spec.VSphere; credentials != nil {
				username = credentials.Username
				password = credentials.Password
			}
		}

		return providercommon.GetVsphereNetworks(ctx, userInfo, seedsGetter, username, password, req.DatacenterName, caBundle)
	}
}

func VsphereTagCategoriesEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(vSphereProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		username := req.Username
		password := req.Password

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credentials := preset.Spec.VSphere; credentials != nil {
				username = credentials.Username
				password = credentials.Password
			}
		}

		return providercommon.GetVsphereTagCategories(ctx, userInfo, seedsGetter, username, password, req.DatacenterName, caBundle)
	}
}

func VsphereTagForTagCategoryEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(vSphereTagsReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		username := req.Username
		password := req.Password

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credentials := preset.Spec.VSphere; credentials != nil {
				username = credentials.Username
				password = credentials.Password
			}
		}

		return providercommon.GetVsphereTagsForTagCategory(ctx, userInfo, seedsGetter, username, password, req.DatacenterName, req.TagCategory, caBundle)
	}
}

func VsphereFoldersEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(vSphereProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		username := req.Username
		password := req.Password

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}

			if credentials := preset.Spec.VSphere; credentials != nil {
				username = credentials.Username
				password = credentials.Password
			}
		}

		return providercommon.GetVsphereFolders(ctx, userInfo, seedsGetter, username, password, req.DatacenterName, caBundle)
	}
}

// VSphereCommonReq represents a request for vSphere data.
// swagger:parameters listVSphereDatastores
type vSphereCommonReq struct {
	// in: header
	Username string
	// in: header
	Password string
	// in: header
	DatacenterName string
	// in: header
	// Credential predefined Kubermatic credential name from the presets
	Credential string
}

func DecodeVSphereCommonReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req vSphereCommonReq

	req.Username = r.Header.Get("Username")
	req.Password = r.Header.Get("Password")
	req.DatacenterName = r.Header.Get("DatacenterName")
	req.Credential = r.Header.Get("Credential")

	return req, nil
}

// vSphereProjectReq represents a request for vSphere data within the context of a KKP project.
// swagger:parameters listProjectVSphereNetworks listProjectVSphereFolders listProjectVSphereDatastores listProjectVSphereTagCategories
type vSphereProjectReq struct {
	common.ProjectReq
	vSphereCommonReq
}

func DecodeVSphereProjectReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	vsphereReq, err := DecodeVSphereCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	return vSphereProjectReq{
		ProjectReq:       projectReq.(common.ProjectReq),
		vSphereCommonReq: vsphereReq.(vSphereCommonReq),
	}, nil
}

// vSphereTagsReq represents a request for vSphere tags within the context of a KKP project.
// swagger:parameters listProjectVSphereTagsForTagCategories
type vSphereTagsReq struct {
	common.ProjectReq
	vSphereCommonReq

	// in: path
	// required: true
	TagCategory string `json:"tag_category"`
}

// Validate validates listProjectVSphereTagsForTagCategories request.
func (r vSphereTagsReq) Validate() error {
	if len(r.TagCategory) == 0 {
		return fmt.Errorf("tag_category cannot be empty")
	}
	return nil
}

func DecodeVSphereTagsReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	vsphereReq, err := DecodeVSphereCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	tagCategory, ok := mux.Vars(r)["tag_category"]
	if !ok {
		return nil, fmt.Errorf("'tag_category' parameter is required")
	}

	return vSphereTagsReq{
		ProjectReq:       projectReq.(common.ProjectReq),
		vSphereCommonReq: vsphereReq.(vSphereCommonReq),
		TagCategory:      tagCategory,
	}, nil
}

// vSphereNoCredentialsReq represent a request for vsphere networks
// swagger:parameters listVSphereNetworksNoCredentialsV2 listVSphereFoldersNoCredentialsV2 listVSphereTagCategoriesNoCredentials
type vSphereNoCredentialsReq struct {
	cluster.GetClusterReq
}

// GetSeedCluster returns the SeedCluster object.
func (req vSphereNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeVSphereNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req vSphereNoCredentialsReq
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

// vSphereTagsNoCredentialsReq represent a request for vsphere tags
// swagger:parameters listVSphereTagsForTagCategoryNoCredentials
type vSphereTagsNoCredentialsReq struct {
	cluster.GetClusterReq

	// in: path
	// required: true
	TagCategory string `json:"tag_category"`
}

// GetSeedCluster returns the SeedCluster object.
func (req vSphereTagsNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// Validate validates listVSphereTagsForTagCategoryNoCredentials request.
func (r vSphereTagsNoCredentialsReq) Validate() error {
	if len(r.TagCategory) == 0 {
		return fmt.Errorf("tag_category cannot be empty")
	}
	return nil
}

func DecodeVSphereTagsNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req vSphereTagsNoCredentialsReq
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

	tagCategory, ok := mux.Vars(r)["tag_category"]
	if !ok {
		return nil, fmt.Errorf("'tag_category' parameter is required")
	}

	req.TagCategory = tagCategory

	return req, nil
}
