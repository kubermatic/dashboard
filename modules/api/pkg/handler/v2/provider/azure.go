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

func AzureSizeWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(azureSizeNoCredentialsReq)
		return providercommon.AzureSizeWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, settingsProvider, req.ProjectID, req.ClusterID)
	}
}

func AzureAvailabilityZonesWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(azureAvailabilityZonesNoCredentialsReq)
		return providercommon.AzureAvailabilityZonesWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.SKUName)
	}
}

func AzureSecurityGroupsEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       azureSecurityGroupsReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(azureSecurityGroupsReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(azureProjectSecurityGroupsReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.azureSecurityGroupsReq
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, projectID)
		if err != nil {
			return nil, err
		}
		return providercommon.AzureSecurityGroupEndpoint(ctx, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.Location, req.ResourceGroup)
	}
}

func AzureResourceGroupsEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       azureResourceGroupsReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(azureResourceGroupsReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(azureProjectResourceGroupsReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.azureResourceGroupsReq
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, projectID)
		if err != nil {
			return nil, err
		}
		return providercommon.AzureResourceGroupEndpoint(ctx, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.Location)
	}
}

func AzureRouteTablesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       azureRouteTablesReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(azureRouteTablesReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(azureProjectRouteTablesReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.azureRouteTablesReq
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, projectID)
		if err != nil {
			return nil, err
		}
		return providercommon.AzureRouteTableEndpoint(ctx, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.Location, req.ResourceGroup)
	}
}

func AzureVirtualNetworksEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       azureVirtualNetworksReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(azureVirtualNetworksReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(azureProjectVirtualNetworksReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.azureVirtualNetworksReq
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, projectID)
		if err != nil {
			return nil, err
		}
		return providercommon.AzureVnetEndpoint(ctx, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.Location, req.ResourceGroup)
	}
}

func AzureSubnetsEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       azureSubnetsReq
			projectID string
		)

		if !withProject {
			commonReq, ok := request.(azureSubnetsReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}
			req = commonReq
		} else {
			projectReq, ok := request.(azureProjectSubnetsReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			projectID = projectReq.GetProjectID()
			req = projectReq.azureSubnetsReq
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, projectID)
		if err != nil {
			return nil, err
		}
		return providercommon.AzureSubnetEndpoint(ctx, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.ResourceGroup, req.VirtualNetwork)
	}
}

func AzureSizesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(azureProjectSizesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, req.ProjectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, req.ProjectID)
		if err != nil {
			return nil, err
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

		return providercommon.AzureSize(ctx, filter, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.Location)
	}
}

func AzureAvailabilityZonesEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(azureProjectAvailabilityZonesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		credentials, err := getAzureCredentialsFromReq(ctx, req.azureCommonReq, userInfoGetter, presetProvider, req.ProjectID)
		if err != nil {
			return nil, err
		}

		return providercommon.AzureSKUAvailabilityZones(ctx, credentials.subscriptionID, credentials.clientID, credentials.clientSecret, credentials.tenantID, req.Location, req.SKUName)
	}
}

type azureCredentials struct {
	subscriptionID string
	tenantID       string
	clientID       string
	clientSecret   string
}

func getAzureCredentialsFromReq(ctx context.Context, req azureCommonReq, userInfoGetter provider.UserInfoGetter, presetProvider provider.PresetProvider, projectID string) (*azureCredentials, error) {
	subscriptionID := req.SubscriptionID
	clientID := req.ClientID
	clientSecret := req.ClientSecret
	tenantID := req.TenantID

	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	if len(req.Credential) > 0 {
		preset, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(projectID), req.Credential)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
		}
		if credentials := preset.Spec.Azure; credentials != nil {
			subscriptionID = credentials.SubscriptionID
			clientID = credentials.ClientID
			clientSecret = credentials.ClientSecret
			tenantID = credentials.TenantID
		}
	}

	return &azureCredentials{
		subscriptionID: subscriptionID,
		tenantID:       tenantID,
		clientID:       clientID,
		clientSecret:   clientSecret,
	}, nil
}

// azureSizeNoCredentialsReq represent a request for Azure VM sizes
// note that the request doesn't have credentials for authN
// swagger:parameters listAzureSizesNoCredentialsV2
type azureSizeNoCredentialsReq struct {
	cluster.GetClusterReq
}

// GetSeedCluster returns the SeedCluster object.
func (req azureSizeNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeAzureSizesNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureSizeNoCredentialsReq
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

// azureAvailabilityZonesNoCredentialsReq represent a request for Azure Availability Zones
// note that the request doesn't have credentials for authN
// swagger:parameters listAzureAvailabilityZonesNoCredentialsV2
type azureAvailabilityZonesNoCredentialsReq struct {
	azureSizeNoCredentialsReq
	// in: header
	// name: SKUName
	SKUName string
}

// GetSeedCluster returns the SeedCluster object.
func (req azureAvailabilityZonesNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeAzureAvailabilityZonesNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureAvailabilityZonesNoCredentialsReq
	lr, err := DecodeAzureSizesNoCredentialsReq(c, r)
	if err != nil {
		return nil, err
	}
	req.azureSizeNoCredentialsReq = lr.(azureSizeNoCredentialsReq)
	req.SKUName = r.Header.Get("SKUName")
	return req, nil
}

// azureCommonReq represent a request for Azure support.
type azureCommonReq struct {
	// in: header
	SubscriptionID string
	// in: header
	TenantID string
	// in: header
	ClientID string
	// in: header
	ClientSecret string
	// in: header
	// Credential predefined Kubermatic credential name from the presets
	Credential string
}

func DecodeAzureCommonReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req azureCommonReq

	req.SubscriptionID = r.Header.Get("SubscriptionID")
	req.TenantID = r.Header.Get("TenantID")
	req.ClientID = r.Header.Get("ClientID")
	req.ClientSecret = r.Header.Get("ClientSecret")
	req.Credential = r.Header.Get("Credential")
	return req, nil
}

// azureProjectSizeReq represent a request for Azure VM sizes within the context of a KKP project
// swagger:parameters listProjectAzureSizes
type azureProjectSizesReq struct {
	common.ProjectReq
	azureCommonReq

	// in: header
	Location string
	// in: header
	// DatacenterName datacenter name
	DatacenterName string
}

func DecodeAzureProjectSizesReq(c context.Context, r *http.Request) (interface{}, error) {
	commonReq, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectSizesReq{
		ProjectReq:     projectReq.(common.ProjectReq),
		azureCommonReq: commonReq.(azureCommonReq),
		Location:       r.Header.Get("Location"),
		DatacenterName: r.Header.Get("DatacenterName"),
	}, nil
}

// AvailabilityZonesReq represent a request for Azure VM Multi-AvailabilityZones support within the context of a KKP project
// swagger:parameters listProjectAzureSKUAvailabilityZones listProjectAzureAvailabilityZones
type azureProjectAvailabilityZonesReq struct {
	common.ProjectReq
	azureCommonReq

	// in: header
	Location string
	// in: header
	SKUName string
}

func DecodeAzureProjectAvailabilityZonesReq(c context.Context, r *http.Request) (interface{}, error) {
	commonReq, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectAvailabilityZonesReq{
		ProjectReq:     projectReq.(common.ProjectReq),
		azureCommonReq: commonReq.(azureCommonReq),
		Location:       r.Header.Get("Location"),
		SKUName:        r.Header.Get("SKUName"),
	}, nil
}

// azureSecurityGroupsReq represent a request for Azure VM security groups
// swagger:parameters listAzureSecurityGroups
type azureSecurityGroupsReq struct {
	azureCommonReq

	// in: header
	ResourceGroup string
	// in: header
	Location string
}

func DecodeAzureSecurityGroupsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureSecurityGroupsReq
	common, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.azureCommonReq = common.(azureCommonReq)
	req.ResourceGroup = r.Header.Get("ResourceGroup")
	req.Location = r.Header.Get("Location")
	return req, nil
}

// azureSecurityGroupsReq represent a request for Azure VM security groups within the context of a KKP project
// swagger:parameters listProjectAzureSecurityGroups
type azureProjectSecurityGroupsReq struct {
	common.ProjectReq
	azureSecurityGroupsReq
}

func DecodeAzureProjectSecurityGroupsReq(c context.Context, r *http.Request) (interface{}, error) {
	securityGroupsReq, err := DecodeAzureSecurityGroupsReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectSecurityGroupsReq{
		ProjectReq:             projectReq.(common.ProjectReq),
		azureSecurityGroupsReq: securityGroupsReq.(azureSecurityGroupsReq),
	}, nil
}

// azureResourceGroupsReq represent a request for Azure VM resource groups
// swagger:parameters listAzureResourceGroups
type azureResourceGroupsReq struct {
	azureCommonReq

	// in: header
	Location string
}

func DecodeAzureResourceGroupsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureResourceGroupsReq
	common, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.azureCommonReq = common.(azureCommonReq)

	req.Location = r.Header.Get("Location")
	return req, nil
}

// azureResourceGroupsReq represent a request for Azure VM resource groups within the context of a KKP project
// swagger:parameters listProjectAzureResourceGroups
type azureProjectResourceGroupsReq struct {
	common.ProjectReq
	azureResourceGroupsReq
}

func DecodeAzureProjectResourceGroupsReq(c context.Context, r *http.Request) (interface{}, error) {
	resourceGroupsReq, err := DecodeAzureResourceGroupsReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectResourceGroupsReq{
		ProjectReq:             projectReq.(common.ProjectReq),
		azureResourceGroupsReq: resourceGroupsReq.(azureResourceGroupsReq),
	}, nil
}

// azureRouteTablesReq represent a request for Azure VM route tables
// swagger:parameters listAzureRouteTables
type azureRouteTablesReq struct {
	azureCommonReq

	// in: header
	ResourceGroup string
	// in: header
	Location string
}

func DecodeAzureRouteTablesReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureRouteTablesReq
	common, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.azureCommonReq = common.(azureCommonReq)
	req.ResourceGroup = r.Header.Get("ResourceGroup")
	req.Location = r.Header.Get("Location")
	return req, nil
}

// azureRouteTablesReq represent a request for Azure VM route tables within the context of a KKP project
// swagger:parameters listProjectAzureRouteTables
type azureProjectRouteTablesReq struct {
	common.ProjectReq
	azureRouteTablesReq
}

func DecodeAzureProjectRouteTablesReq(c context.Context, r *http.Request) (interface{}, error) {
	routeTablesReq, err := DecodeAzureRouteTablesReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectRouteTablesReq{
		ProjectReq:          projectReq.(common.ProjectReq),
		azureRouteTablesReq: routeTablesReq.(azureRouteTablesReq),
	}, nil
}

// azureVirtualNetworksReq represent a request for Azure VM virtual networks
// swagger:parameters listAzureVnets
type azureVirtualNetworksReq struct {
	azureCommonReq

	// in: header
	ResourceGroup string
	// in: header
	Location string
}

func DecodeAzureVirtualNetworksReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureVirtualNetworksReq
	common, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.azureCommonReq = common.(azureCommonReq)
	req.ResourceGroup = r.Header.Get("ResourceGroup")
	req.Location = r.Header.Get("Location")
	return req, nil
}

// azureVirtualNetworksReq represent a request for Azure VM virtual networks within the context of a KKP project
// swagger:parameters listProjectAzureVnets
type azureProjectVirtualNetworksReq struct {
	common.ProjectReq
	azureVirtualNetworksReq
}

func DecodeAzureProjectVirtualNetworksReq(c context.Context, r *http.Request) (interface{}, error) {
	virtualNetworksReq, err := DecodeAzureVirtualNetworksReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectVirtualNetworksReq{
		ProjectReq:              projectReq.(common.ProjectReq),
		azureVirtualNetworksReq: virtualNetworksReq.(azureVirtualNetworksReq),
	}, nil
}

// azureSubnetsReq represent a request for Azure VM subnets
// swagger:parameters listAzureSubnets
type azureSubnetsReq struct {
	azureCommonReq

	// in: header
	ResourceGroup string
	// in: header
	VirtualNetwork string
}

func DecodeAzureSubnetsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req azureSubnetsReq
	common, err := DecodeAzureCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.azureCommonReq = common.(azureCommonReq)
	req.ResourceGroup = r.Header.Get("ResourceGroup")
	req.VirtualNetwork = r.Header.Get("VirtualNetwork")
	return req, nil
}

// azureSubnetsReq represent a request for Azure VM subnets within the context of a KKP project
// swagger:parameters listProjectAzureSubnets
type azureProjectSubnetsReq struct {
	common.ProjectReq
	azureSubnetsReq
}

func DecodeAzureProjectSubnetsReq(c context.Context, r *http.Request) (interface{}, error) {
	subnetsReq, err := DecodeAzureSubnetsReq(c, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	return azureProjectSubnetsReq{
		ProjectReq:      projectReq.(common.ProjectReq),
		azureSubnetsReq: subnetsReq.(azureSubnetsReq),
	}, nil
}
