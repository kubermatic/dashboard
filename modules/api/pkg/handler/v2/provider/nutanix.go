/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/ptr"
)

type NutanixCommonReq struct {
	// KKP Datacenter to use for endpoint
	// in: path
	// required: true
	DC string `json:"dc"`

	// in: header
	// name: NutanixUsername
	NutanixUsername string

	// in: header
	// name: NutanixPassword
	NutanixPassword string

	// in: header
	// name: NutanixProxyURL
	NutanixProxyURL string

	// in: header
	// name: Credential
	Credential string
}

// NutanixClusterReq represents a request for Nutanix clusters
// swagger:parameters listNutanixClusters
type NutanixClusterReq struct {
	NutanixCommonReq
}

// NutanixProjectClusterReq represents a request for Nutanix clusters within the context of a KKP project
// swagger:parameters listProjectNutanixClusters
type NutanixProjectClusterReq struct {
	common.ProjectReq
	NutanixClusterReq
}

// NutanixProjectReq represents a request for Nutanix projects
// swagger:parameters listNutanixProjects
type NutanixProjectReq struct {
	NutanixCommonReq
}

// NutanixProjectProjectReq represents a request for Nutanix projects within the context of a KKP project
// swagger:parameters listProjectNutanixProjects
type NutanixProjectProjectReq struct {
	common.ProjectReq
	NutanixProjectReq
}

// NutanixSubnetReq represents a request for Nutanix subnets
// swagger:parameters listNutanixSubnets
type NutanixSubnetReq struct {
	NutanixCommonReq

	// in: header
	// name: NutanixCluster
	// required: true
	NutanixCluster string

	// Project query parameter. Can be omitted to query subnets without project scope
	// in: header
	// name: NutanixProject
	NutanixProject string
}

// NutanixProjectSubnetReq represents a request for Nutanix subnets within the context of a KKP project
// swagger:parameters listProjectNutanixSubnets
type NutanixProjectSubnetReq struct {
	common.ProjectReq
	NutanixSubnetReq
}

// NutanixCategoryReq represents a request for Nutanix categories
// swagger:parameters listNutanixCategories
type NutanixCategoryReq struct {
	NutanixCommonReq
}

// NutanixProjectCategoryReq represents a request for Nutanix categories within the context of a KKP project
// swagger:parameters listProjectNutanixCategories
type NutanixProjectCategoryReq struct {
	common.ProjectReq
	NutanixCategoryReq
}

// NutanixCategoryValueReq represents a request for Nutanix category values for a specific category
// swagger:parameters listNutanixCategoryValues
type NutanixCategoryValueReq struct {
	NutanixCommonReq

	// Category to query the available values for
	// in: path
	// required: true
	Category string `json:"category"`
}

// NutanixProjectCategoryValueReq represents a request for Nutanix category values for a specific category within the context of a KKP project
// swagger:parameters listProjectNutanixCategoryValues
type NutanixProjectCategoryValueReq struct {
	common.ProjectReq
	NutanixCategoryValueReq
}

// NutanixNoCredentialReq represent a request for Nutanix information with cluster-provided credentials
// swagger:parameters listNutanixSubnetsNoCredentials listNutanixCategoriesNoCredentials
type NutanixNoCredentialReq struct {
	cluster.GetClusterReq
}

// NutanixCategoryValuesNoCredentialReq represents a request for Nutanix category values with cluster-provided credentials
// swagger:parameters listNutanixCategoryValuesNoCredentials
type NutanixCategoryValuesNoCredentialReq struct {
	NutanixNoCredentialReq

	// Category to query the available values for
	// in: path
	// required: true
	Category string `json:"category"`
}

func DecodeNutanixCommonReq(c context.Context, r *http.Request) (interface{}, error) {
	var req NutanixCommonReq

	req.NutanixUsername = r.Header.Get("NutanixUsername")
	req.NutanixPassword = r.Header.Get("NutanixPassword")
	req.NutanixProxyURL = r.Header.Get("NutanixProxyURL")
	req.Credential = r.Header.Get("Credential")

	dc, ok := mux.Vars(r)["dc"]
	if !ok {
		return nil, fmt.Errorf("'dc' parameter is required")
	}
	req.DC = dc

	return req, nil
}

func DecodeNutanixProjectClusterReq(c context.Context, r *http.Request) (interface{}, error) {
	commonReq, err := DecodeNutanixCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return NutanixProjectClusterReq{
		ProjectReq: projectReq.(common.ProjectReq),
		NutanixClusterReq: NutanixClusterReq{
			NutanixCommonReq: commonReq.(NutanixCommonReq),
		},
	}, nil
}

func DecodeNutanixProjectProjectReq(c context.Context, r *http.Request) (interface{}, error) {
	commonReq, err := DecodeNutanixCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return NutanixProjectProjectReq{
		ProjectReq: projectReq.(common.ProjectReq),
		NutanixProjectReq: NutanixProjectReq{
			NutanixCommonReq: commonReq.(NutanixCommonReq),
		},
	}, nil
}

func DecodeNutanixSubnetReq(c context.Context, r *http.Request) (interface{}, error) {
	var req NutanixSubnetReq

	commonReq, err := DecodeNutanixCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.NutanixCommonReq = commonReq.(NutanixCommonReq)
	req.NutanixCluster = r.Header.Get("NutanixCluster")
	req.NutanixProject = r.Header.Get("NutanixProject")

	return req, nil
}

func DecodeNutanixProjectSubnetReq(c context.Context, r *http.Request) (interface{}, error) {
	subnetReq, err := DecodeNutanixSubnetReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return NutanixProjectSubnetReq{
		ProjectReq:       projectReq.(common.ProjectReq),
		NutanixSubnetReq: subnetReq.(NutanixSubnetReq),
	}, nil
}

func DecodeNutanixCategoryValueReq(c context.Context, r *http.Request) (interface{}, error) {
	var req NutanixCategoryValueReq

	commonReq, err := DecodeNutanixCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	category, ok := mux.Vars(r)["category"]
	if !ok {
		return nil, fmt.Errorf("'category' parameter is required")
	}

	req.NutanixCommonReq = commonReq.(NutanixCommonReq)
	req.Category = category

	return req, nil
}

func DecodeNutanixProjectCategoryReq(c context.Context, r *http.Request) (interface{}, error) {
	commonReq, err := DecodeNutanixCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return NutanixProjectCategoryReq{
		NutanixCategoryReq: NutanixCategoryReq{
			NutanixCommonReq: commonReq.(NutanixCommonReq),
		},
		ProjectReq: projectReq.(common.ProjectReq),
	}, nil
}

func DecodeNutanixProjectCategoryValueReq(c context.Context, r *http.Request) (interface{}, error) {
	categoryValueReq, err := DecodeNutanixCategoryValueReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return NutanixProjectCategoryValueReq{
		NutanixCategoryValueReq: categoryValueReq.(NutanixCategoryValueReq),
		ProjectReq:              projectReq.(common.ProjectReq),
	}, nil
}

func DecodeNutanixNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req NutanixNoCredentialReq

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

func DecodeNutanixCategoryValuesNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req NutanixCategoryValuesNoCredentialReq

	noCredsReq, err := DecodeNutanixNoCredentialReq(c, r)
	if err != nil {
		return nil, err
	}

	category, ok := mux.Vars(r)["category"]
	if !ok {
		return nil, fmt.Errorf("'category' parameter is required")
	}

	req.NutanixNoCredentialReq = noCredsReq.(NutanixNoCredentialReq)
	req.Category = category

	return req, nil
}

// NutanixClusterEndpoint handles the request for a list of clusters, using provided credentials.
func NutanixClusterEndpoint(presetProvider provider.PresetProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       NutanixCommonReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(NutanixCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(NutanixProjectClusterReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.NutanixCommonReq
		}

		client, _, err := getNutanixClient(ctx, req, presetProvider, seedsGetter, userInfoGetter, projectID)
		if err != nil {
			return nil, err
		}

		clusters, err := client.ListNutanixClusters(ctx)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("cannot list clusters: %s", err.Error()))
		}

		return clusters, nil
	}
}

// NutanixProjectEndpoint handles the request for a list of projects, using provided credentials.
func NutanixProjectEndpoint(presetProvider provider.PresetProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       NutanixCommonReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(NutanixCommonReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(NutanixProjectProjectReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.NutanixCommonReq
		}

		client, _, err := getNutanixClient(ctx, req, presetProvider, seedsGetter, userInfoGetter, projectID)
		if err != nil {
			return nil, err
		}

		projects, err := client.ListNutanixProjects(ctx)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("cannot list projects: %s", err.Error()))
		}

		return projects, nil
	}
}

// NutanixSubnetEndpoint handles the request for a list of subnets on a specific Nutanix cluster, using provided credentials.
func NutanixSubnetEndpoint(presetProvider provider.PresetProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       NutanixSubnetReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(NutanixSubnetReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(NutanixProjectSubnetReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.NutanixSubnetReq
		}

		client, creds, err := getNutanixClient(ctx, req.NutanixCommonReq, presetProvider, seedsGetter, userInfoGetter, projectID)
		if err != nil {
			return nil, err
		}

		cluster := req.NutanixCluster
		project := req.NutanixProject

		if creds != nil {
			cluster = creds.ClusterName
			project = creds.ProjectName
		}

		subnets, err := client.ListNutanixSubnets(ctx, cluster, project)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("cannot list subnets: %s", err.Error()))
		}

		return subnets, nil
	}
}

func NutanixCategoryEndpoint(presetProvider provider.PresetProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       NutanixCategoryReq
			projectID string
		)

		if !withProject {
			catValueReq, ok := request.(NutanixCategoryReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = catValueReq
		} else {
			projectReq, ok := request.(NutanixProjectCategoryReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.NutanixCategoryReq
		}

		client, _, err := getNutanixClient(ctx, req.NutanixCommonReq, presetProvider, seedsGetter, userInfoGetter, projectID)
		if err != nil {
			return nil, err
		}

		categories, err := client.ListNutanixCategories(ctx)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("cannot list categories: %s", err.Error()))
		}

		return categories, nil
	}
}

func NutanixCategoryValuesEndpoint(presetProvider provider.PresetProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       NutanixCategoryValueReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(NutanixCategoryValueReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(NutanixProjectCategoryValueReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.NutanixCategoryValueReq
		}

		client, _, err := getNutanixClient(ctx, req.NutanixCommonReq, presetProvider, seedsGetter, userInfoGetter, projectID)
		if err != nil {
			return nil, err
		}

		categories, err := client.ListNutanixCategoryValues(ctx, req.Category)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("cannot list category values for '%s': %s", req.Category, err.Error()))
		}

		return categories, nil
	}
}

func getNutanixClient(ctx context.Context, req NutanixCommonReq, presetProvider provider.PresetProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, projectID string) (providercommon.NutanixClientSet, *kubermaticv1.Nutanix, error) {
	creds := providercommon.NutanixCredentials{
		ProxyURL: req.NutanixProxyURL,
		Username: req.NutanixUsername,
		Password: req.NutanixPassword,
	}

	var credential *kubermaticv1.Nutanix

	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return nil, nil, common.KubernetesErrorToHTTPError(err)
	}

	if len(req.Credential) > 0 {
		preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(projectID), req.Credential)
		if err != nil {
			return nil, nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
		}
		if credential = preset.Spec.Nutanix; credential != nil {
			creds.ProxyURL = credential.ProxyURL
			creds.Username = credential.Username
			creds.Password = credential.Password
		}
	}

	if creds.Username == "" || creds.Password == "" {
		return nil, nil, utilerrors.NewBadRequest("no valid credentials found")
	}

	_, dc, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, req.DC)
	if err != nil {
		return nil, nil, utilerrors.NewBadRequest("%v", err)
	}
	if dc.Spec.Nutanix == nil {
		return nil, nil, utilerrors.NewBadRequest("datacenter '%s' is not a Nutanix datacenter", req.DC)
	}

	client := providercommon.NewNutanixClient(dc.Spec.Nutanix, &creds)
	return client, credential, nil
}

func NutanixSubnetsWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(NutanixNoCredentialReq)
		return providercommon.NutanixSubnetsWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

func NutanixCategoriesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(NutanixNoCredentialReq)
		return providercommon.NutanixCategoriesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

func NutanixCategoryValuesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(NutanixCategoryValuesNoCredentialReq)
		return providercommon.NutanixCategoryValuesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.Category)
	}
}
