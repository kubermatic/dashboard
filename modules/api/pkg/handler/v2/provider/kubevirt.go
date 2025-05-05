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

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticprovider "k8c.io/kubermatic/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/apimachinery/pkg/util/sets"
	"k8s.io/utils/ptr"
)

// KubeVirtGenericReq represent a request with common parameters for KubeVirt.
// swagger:parameters listKubeVirtStorageClasses listKubeVirtPreferences listKubeVirtInstancetypes
type KubeVirtGenericReq struct {
	// in: header
	// name: Kubeconfig (provided credential)
	Kubeconfig string
	// in: header
	// name: Credential (predefined Kubermatic credential name from the Kubermatic presets)
	Credential string
	// in: header
	// required: false
	// DatacenterName datacenter name
	DatacenterName string
}

// swagger:parameters listProjectKubeVirtStorageClasses listProjectKubeVirtPreferences listProjectKubevirtVPCs listProjectKubeVirtInstancetypes
type KubeVirtProjectGenericReq struct {
	common.ProjectReq
	KubeVirtGenericReq
}

// swagger:parameters listProjectKubevirtSubnets
type KubeVirtVPCSubnetsReq struct {
	common.ProjectReq
	KubeVirtGenericReq
	// in: header
	// name: VPCName
	VPCName string
	// in: header
	// name: StorageClassName
	StorageClassName string
}

// KubeVirtListImagesReq represents a request to list KubeVirt images
// swagger:parameters listKubevirtImages
type KubeVirtListImagesReq struct {
	// in: path
	// required: true
	DC string `json:"dc"`
}

// KubeVirtGenericNoCredentialReq represent a generic KubeVirt request with cluster credentials.
// swagger:parameters listKubevirtStorageClassesNoCredentials listKubeVirtPreferencesNoCredentials listKubeVirtInstancetypesNoCredentials
type KubeVirtGenericNoCredentialReq struct {
	cluster.GetClusterReq
}

// KubeVirtSubnetsNoCredentialReq represent a KubeVirt provider network subnet request with cluster credentials.
// swagger:parameters listKubeVirtSubnetsNoCredentials
type KubeVirtSubnetsNoCredentialReq struct {
	cluster.GetClusterReq
	// in: query
	StorageClassName string `json:"storageClassName,omitempty"`
}

func getKubeconfig(ctx context.Context, kubeconfig, credential, projectID string, presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) (string, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return "", common.KubernetesErrorToHTTPError(err)
	}
	if len(credential) > 0 {
		preset, err := presetsProvider.GetPreset(ctx, userInfo, ptr.To(projectID), credential)
		if err != nil {
			return "", utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", credential, userInfo.Email))
		}
		if credentials := preset.Spec.Kubevirt; credentials != nil {
			kubeconfig = credentials.Kubeconfig
		}
	}
	return kubeconfig, nil
}

func getKubeconfigAndVPCName(ctx context.Context, kubeconfig, vpcName, credential, projectID string, presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) (string, string, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return "", "", common.KubernetesErrorToHTTPError(err)
	}
	if len(credential) > 0 {
		preset, err := presetsProvider.GetPreset(ctx, userInfo, ptr.To(projectID), credential)
		if err != nil {
			return "", "", utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", credential, userInfo.Email))
		}
		if credentials := preset.Spec.Kubevirt; credentials != nil {
			kubeconfig = credentials.Kubeconfig
			vpcName = credentials.VPCName
		}
	}
	return kubeconfig, vpcName, nil
}

// KubeVirtInstancetypesEndpoint handles the request to list available KubeVirtInstancetypes (provided credentials).
func KubeVirtInstancetypesEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, settingsProvider provider.SettingsProvider, withProject bool) endpoint.Endpoint {
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

		return providercommon.KubeVirtInstancetypes(ctx, projectID, kubeconfig, req.DatacenterName, nil, settingsProvider, userInfoGetter, seedsGetter)
	}
}

// KubeVirtPreferencesEndpoint handles the request to list available KubeVirtPreferences (provided credentials).
func KubeVirtPreferencesEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, seedsGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
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

		return providercommon.KubeVirtPreferences(ctx, projectID, kubeconfig, req.DatacenterName, nil, settingsProvider, userInfoGetter, seedsGetter)
	}
}

// KubeVirtInstacetypesWithClusterCredentialsEndpoint handles the request to list available KubeVirtInstancetypes (cluster credentials).
func KubeVirtInstancetypesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtGenericNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtInstancetypesWithClusterCredentialsEndpoint(ctx, userInfoGetter, seedsGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID, settingsProvider)
	}
}

// KubeVirtPreferencesWithClusterCredentialsEndpoint handles the request to list available KubeVirtPreferences (cluster credentials).
func KubeVirtPreferencesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtGenericNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtPreferencesWithClusterCredentialsEndpoint(ctx, userInfoGetter, seedsGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID, settingsProvider)
	}
}

// KubeVirtStorageClassesEndpoint handles the request to list available k8s StorageClasses (provided credentials).
func KubeVirtStorageClassesEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
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

		return providercommon.KubeVirtStorageClasses(ctx, kubeconfig, req.DatacenterName, userInfoGetter, seedsGetter)
	}
}

// KubeVirtVPCsEndpoint handles the request to list available VPCs.
func KubeVirtVPCsEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, _ kubermaticprovider.SeedsGetter, withProject bool) endpoint.Endpoint {
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

		return providercommon.KubeVirtVPCs(ctx, kubeconfig)
	}
}

// KubeVirtSubnetsEndpoint handles the request to list available subnets.
func KubeVirtSubnetsEndpoint(presetsProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req              KubeVirtGenericReq
			projectID        string
			vpcName          string
			storageClassName string
		)

		if !withProject {
			kubevirtReq, ok := request.(KubeVirtGenericReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = kubevirtReq
		} else {
			vpcSubnetsReq, ok := request.(KubeVirtVPCSubnetsReq)
			if !ok {
				return "", utilerrors.NewBadRequest("invalid request")
			}

			req = vpcSubnetsReq.KubeVirtGenericReq
			projectID = vpcSubnetsReq.GetProjectID()
			vpcName = vpcSubnetsReq.VPCName
			storageClassName = vpcSubnetsReq.StorageClassName
		}

		userInfo, err := userInfoGetter(ctx, projectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, req.DatacenterName)
		if err != nil {
			return nil, fmt.Errorf("error getting dc: %w", err)
		}

		// If preset was used, vpcName will be empty and returned by the function instead.
		kubeconfig, vpcName, err := getKubeconfigAndVPCName(ctx, req.Kubeconfig, vpcName, req.Credential, projectID, presetsProvider, userInfoGetter)
		if err != nil {
			return nil, err
		}

		if datacenter.Spec.Kubevirt != nil &&
			datacenter.Spec.Kubevirt.ProviderNetwork != nil &&
			len(datacenter.Spec.Kubevirt.ProviderNetwork.VPCs) > 0 {
			kvSubnets := apiv2.KubeVirtSubnetList{}
			for _, vpc := range datacenter.Spec.Kubevirt.ProviderNetwork.VPCs {
				if vpc.Name == vpcName {
					for _, subnet := range vpc.Subnets {
						if datacenter.Spec.Kubevirt.MatchSubnetAndStorageLocation != nil && *datacenter.Spec.Kubevirt.MatchSubnetAndStorageLocation {
							for _, sc := range datacenter.Spec.Kubevirt.InfraStorageClasses {
								if storageClassName == "" && sc.IsDefaultClass != nil && *sc.IsDefaultClass {
									storageClassName = sc.Name
								}
								if sc.Name == storageClassName {
									scRegions := sets.New[string]().Insert(sc.Regions...)
									scZones := sets.New[string]().Insert(sc.Zones...)

									if scRegions.HasAll(subnet.Regions...) && scZones.HasAll(subnet.Zones...) {
										kvSubnet := apiv2.KubeVirtSubnet{
											Name: subnet.Name,
										}

										kvSubnets = append(kvSubnets, kvSubnet)
									}
								}
							}
						} else {
							kvSubnet := apiv2.KubeVirtSubnet{
								Name: subnet.Name,
							}

							kvSubnets = append(kvSubnets, kvSubnet)
						}
					}
				}
			}

			return kvSubnets, nil
		}

		return providercommon.KubeVirtVPCSubnets(ctx, kubeconfig, vpcName)
	}
}

// KubeVirtStorageClassesWithClusterCredentialsEndpoint handles the request to list storage classes (cluster credentials).
func KubeVirtStorageClassesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtGenericNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtStorageClassesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

// KubeVirtVPCsWithClusterCredentialsEndpoint handles the request to list VPCs (cluster credentials).
func KubeVirtVPCsWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtGenericNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtVPCsWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

// KubeVirtSubnetsWithClusterCredentialsEndpoint handles the request to list Subnets for a VPC (cluster credentials).
func KubeVirtSubnetsWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtSubnetsNoCredentialReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtSubnetsWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.StorageClassName)
	}
}

func KubeVirtImagesEndpoint(userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(KubeVirtListImagesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.KubeVirtImages(ctx, req.DC, userInfoGetter, seedsGetter)
	}
}

// Decoders

func DecodeKubeVirtGenericReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtGenericReq
	req.Kubeconfig = r.Header.Get("Kubeconfig")
	req.Credential = r.Header.Get("Credential")
	req.DatacenterName = r.Header.Get("DatacenterName")

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

func DecodeKubeVirtVPCSubnetsReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	kubevirtReq, err := DecodeKubeVirtGenericReq(c, r)
	if err != nil {
		return nil, err
	}

	vpcName := r.Header.Get("VPCName")
	storageClassName := r.Header.Get("StorageClassName")
	return KubeVirtVPCSubnetsReq{
		ProjectReq:         projectReq.(common.ProjectReq),
		KubeVirtGenericReq: kubevirtReq.(KubeVirtGenericReq),
		VPCName:            vpcName,
		StorageClassName:   storageClassName,
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

func DecodeKubeVirtSubnetsNoCredentialReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtSubnetsNoCredentialReq
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
	req.StorageClassName = r.URL.Query().Get("storageClassName")

	return req, nil
}

func DecodeKubeVirtListImageReq(c context.Context, r *http.Request) (interface{}, error) {
	var req KubeVirtListImagesReq

	dc, ok := mux.Vars(r)["dc"]
	if !ok {
		return req, fmt.Errorf("'dc' parameter is required")
	}
	req.DC = dc

	return req, nil
}
