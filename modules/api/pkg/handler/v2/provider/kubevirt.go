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

	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/pointer"
)

// KubeVirtGenericReq represent a request with common parameters for KubeVirt.
// swagger:parameters listKubeVirtStorageClasses listKubeVirtPreferences
type KubeVirtGenericReq struct {
	// in: header
	// name: Kubeconfig (provided credential)
	Kubeconfig string
	// in: header
	// name: Credential (predefined Kubermatic credential name from the Kubermatic presets)
	Credential string
}

// swagger:parameters listProjectKubeVirtStorageClasses listProjectKubeVirtPreferences
type KubeVirtProjectGenericReq struct {
	common.ProjectReq
	KubeVirtGenericReq
}

// KubeVirtListInstanceReq represent a request to list presets or instance types for KubeVirt.
// swagger:parameters listKubeVirtInstancetypes
type KubeVirtListInstanceReq struct {
	KubeVirtGenericReq

	// in: header
	// DatacenterName datacenter name
	DatacenterName string
}

// swagger:parameters listProjectKubeVirtInstancetypes
type KubeVirtProjectListInstanceReq struct {
	common.ProjectReq
	KubeVirtListInstanceReq
}

// KubeVirtGenericNoCredentialReq represent a generic KubeVirt request with cluster credentials.
// swagger:parameters listKubevirtStorageClassesNoCredentials listKubeVirtPreferencesNoCredentials
type KubeVirtGenericNoCredentialReq struct {
	cluster.GetClusterReq
}

// KubeVirtListInstancesNoCredentialReq represent a request to list presets or instance types for KubeVirt.
// swagger:parameters listKubeVirtInstancetypesNoCredentials
type KubeVirtListInstancesNoCredentialReq struct {
	cluster.GetClusterReq

	// in: header
	// DatacenterName datacenter name
	DatacenterName string
}

func getKubeconfig(ctx context.Context, kubeconfig, credential, projectID string, presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) (string, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return "", common.KubernetesErrorToHTTPError(err)
	}
	if len(credential) > 0 {
		preset, err := presetsProvider.GetPreset(ctx, userInfo, pointer.String(projectID), credential)
		if err != nil {
			return "", utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", credential, userInfo.Email))
		}
		if credentials := preset.Spec.Kubevirt; credentials != nil {
			kubeconfig = credentials.Kubeconfig
		}
	}
	return kubeconfig, nil
}

// KubeVirtInstancetypesEndpoint handles the request to list available KubeVirtInstancetypes (provided credentials).
func KubeVirtInstancetypesEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, settingsProvider provider.SettingsProvider, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       KubeVirtListInstanceReq
			projectID string
		)

		if !withProject {
			kubevirtReq, ok := request.(KubeVirtListInstanceReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = kubevirtReq
		} else {
			projectReq, ok := request.(KubeVirtProjectListInstanceReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = projectReq.KubeVirtListInstanceReq
			projectID = projectReq.GetProjectID()
		}

		kubeconfig, err := getKubeconfig(ctx, req.Kubeconfig, req.Credential, projectID, presetsProvider, userInfoGetter)
		if err != nil {
			return nil, err
		}

		return providercommon.KubeVirtInstancetypes(ctx, kubeconfig, req.DatacenterName, nil, settingsProvider, userInfoGetter, seedsGetter)
	}
}

// KubeVirtPreferencesEndpoint handles the request to list available KubeVirtPreferences (provided credentials).
func KubeVirtPreferencesEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       KubeVirtGenericReq
			projectID string
		)

		if !withProject {
			kubevirtReq, ok := request.(KubeVirtGenericReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = kubevirtReq
		} else {
			projectReq, ok := request.(KubeVirtProjectGenericReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = projectReq.KubeVirtGenericReq
			projectID = projectReq.GetProjectID()
		}

		kubeconfig, err := getKubeconfig(ctx, req.Kubeconfig, req.Credential, projectID, presetsProvider, userInfoGetter)
		if err != nil {
			return nil, err
		}

		return providercommon.KubeVirtPreferences(ctx, kubeconfig, nil, settingsProvider)
	}
}

// KubeVirtInstacetypesWithClusterCredentialsEndpoint handles the request to list available KubeVirtInstancetypes (cluster credentials).
func KubeVirtInstancetypesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtListInstancesNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtInstancetypesWithClusterCredentialsEndpoint(ctx, userInfoGetter, seedsGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID, req.DatacenterName, settingsProvider)
	}
}

// KubeVirtPreferencesWithClusterCredentialsEndpoint handles the request to list available KubeVirtPreferences (cluster credentials).
func KubeVirtPreferencesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtGenericNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtPreferencesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID, settingsProvider)
	}
}

// KubeVirtStorageClassesEndpoint handles the request to list available k8s StorageClasses (provided credentials).
func KubeVirtStorageClassesEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       KubeVirtGenericReq
			projectID string
		)

		if !withProject {
			kubevirtReq, ok := request.(KubeVirtGenericReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = kubevirtReq
		} else {
			projectReq, ok := request.(KubeVirtProjectGenericReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = projectReq.KubeVirtGenericReq
			projectID = projectReq.GetProjectID()
		}

		kubeconfig, err := getKubeconfig(ctx, req.Kubeconfig, req.Credential, projectID, presetsProvider, userInfoGetter)
		if err != nil {
			return nil, err
		}

		return providercommon.KubeVirtStorageClasses(ctx, kubeconfig)
	}
}

// KubeVirtStorageClassesWithClusterCredentialsEndpoint handles the request to list storage classes (cluster credentials).
func KubeVirtStorageClassesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtGenericNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtStorageClassesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	}
}

// Decoders

func DecodeKubeVirtGenericReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtGenericReq
	req.Kubeconfig = r.Header.Get("Kubeconfig")
	req.Credential = r.Header.Get("Credential")

	return req, nil
}

func DecodeKubeVirtProjectGenericReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	kubevirtReq, err := DecodeKubeVirtGenericReq(c, r)
	if err != nil {
		return nil, err
	}

	return KubeVirtProjectGenericReq{
		ProjectReq:         projectReq.(common.ProjectReq),
		KubeVirtGenericReq: kubevirtReq.(KubeVirtGenericReq),
	}, nil
}

func DecodeKubeVirtListInstanceReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtListInstanceReq
	req.Kubeconfig = r.Header.Get("Kubeconfig")
	req.Credential = r.Header.Get("Credential")
	req.DatacenterName = r.Header.Get("DatacenterName")

	return req, nil
}

func DecodeKubeVirtProjectListInstanceReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	kubevirtReq, err := DecodeKubeVirtListInstanceReq(c, r)
	if err != nil {
		return nil, err
	}

	return KubeVirtProjectListInstanceReq{
		ProjectReq:              projectReq.(common.ProjectReq),
		KubeVirtListInstanceReq: kubevirtReq.(KubeVirtListInstanceReq),
	}, nil
}

func DecodeKubeVirtGenericNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtGenericNoCredentialReq
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

func DecodeKubeVirtListInstancesNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtListInstancesNoCredentialReq
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
	req.DatacenterName = r.Header.Get("DatacenterName")

	return req, nil
}
