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
	"strconv"
	"strings"

	"github.com/go-kit/kit/endpoint"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	providerv1 "k8c.io/dashboard/v2/pkg/handler/v1/provider"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

func OpenstackSizeWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackNoCredentialsReq)
		return providercommon.OpenstackSizeWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, settingsProvider, req.ProjectID, req.ClusterID, caBundle)
	}
}

func OpenstackTenantWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackNoCredentialsReq)
		return providercommon.OpenstackTenantWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func OpenstackNetworkWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackNoCredentialsReq)
		return providercommon.OpenstackNetworkWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func OpenstackSecurityGroupWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackNoCredentialsReq)
		return providercommon.OpenstackSecurityGroupWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func OpenstackServerGroupWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackNoCredentialsReq)
		return providercommon.OpenstackServerGroupWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func OpenstackServerGroupEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackReq)
		if !ok {
			return nil, fmt.Errorf("incorrect type of request, expected = OpenstackReq, got %T", request)
		}

		userInfo, cred, err := providerv1.GetOpenstackAuthInfo(ctx, providerv1.OpenstackReq(req), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}
		return providercommon.GetOpenstackServerGroups(ctx, userInfo, seedsGetter, cred, req.DatacenterName, caBundle)
	}
}

func OpenstackSubnetsWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackSubnetNoCredentialsReq)
		return providercommon.OpenstackSubnetsWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, req.NetworkID, caBundle)
	}
}

func OpenstackAvailabilityZoneWithClusterCredentialsEndpoint(projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(openstackNoCredentialsReq)
		return providercommon.OpenstackAvailabilityZoneWithClusterCredentialsEndpoint(ctx, userInfoGetter, projectProvider,
			privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID, caBundle)
	}
}

func OpenstackSubnetPoolEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackSubnetPoolReq)
		if !ok {
			return nil, fmt.Errorf("incorrect type of request, expected = OpenstackReq, got %T", request)
		}
		userInfo, cred, err := providerv1.GetOpenstackAuthInfo(ctx, req.OpenstackReq, userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}
		return providercommon.GetOpenstackSubnetPools(ctx, userInfo, seedsGetter, cred, req.DatacenterName, req.IPVersion, caBundle)
	}
}

// openstackNoCredentialsReq represent a request for openstack
// swagger:parameters listOpenstackSizesNoCredentialsV2 listOpenstackTenantsNoCredentialsV2 listOpenstackNetworksNoCredentialsV2 listOpenstackSecurityGroupsNoCredentialsV2 listOpenstackAvailabilityZonesNoCredentialsV2 listOpenstackServerGroupsNoCredentials
type openstackNoCredentialsReq struct {
	cluster.GetClusterReq
}

// GetSeedCluster returns the SeedCluster object.
func (req openstackNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeOpenstackNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req openstackNoCredentialsReq
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

// openstackSubnetNoCredentialsReq represent a request for openstack subnets
// swagger:parameters listOpenstackSubnetsNoCredentialsV2
type openstackSubnetNoCredentialsReq struct {
	openstackNoCredentialsReq
	// in: query
	NetworkID string `json:"network_id,omitempty"`
}

// GetSeedCluster returns the SeedCluster object.
func (req openstackSubnetNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

func DecodeOpenstackSubnetNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req openstackSubnetNoCredentialsReq
	lr, err := DecodeOpenstackNoCredentialsReq(c, r)
	if err != nil {
		return nil, err
	}
	req.openstackNoCredentialsReq = lr.(openstackNoCredentialsReq)

	req.NetworkID = r.URL.Query().Get("network_id")
	if req.NetworkID == "" {
		return nil, fmt.Errorf("get openstack subnets needs a parameter 'network_id'")
	}

	return req, nil
}

// OpenstackSubnetPoolReq represent a request for openstack subnet pools
// swagger:parameters listOpenstackSubnetPools
type OpenstackSubnetPoolReq struct {
	providerv1.OpenstackReq
	// in: query
	IPVersion int `json:"ip_version,omitempty"`
}

func DecodeOpenstackSubnetPoolReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req OpenstackSubnetPoolReq

	openstackReq, err := providerv1.DecodeOpenstackReq(context.Background(), r)
	if err != nil {
		return nil, err
	}
	req.OpenstackReq = openstackReq.(providerv1.OpenstackReq)

	ipVersion := r.URL.Query().Get("ip_version")
	if ipVersion != "" {
		req.IPVersion, err = strconv.Atoi(ipVersion)
		if err != nil || (req.IPVersion != 4 && req.IPVersion != 6) {
			return nil, utilerrors.NewBadRequest("invalid value for `ip_version` (should be 4 or 6)")
		}
	}

	return req, nil
}

// OpenstackReq represent a request for openstack
// swagger:parameters listOpenstackServerGroups
type OpenstackReq struct {
	// in: header
	// Username OpenStack user name
	Username string
	// in: header
	// Password OpenStack user password
	Password string
	// in: header
	// Domain OpenStack domain name
	Domain string
	// in: header
	// Tenant OpenStack tenant name (depreciated in favor of Project instead)
	Tenant string
	// in: header
	// TenantID OpenStack tenant ID (depreciated in favor of  ProjectID instead)
	TenantID string
	// in: header
	// Project OpenStack project name
	Project string
	// in: header
	// ProjectID OpenStack project ID
	ProjectID string
	// in: header
	// DatacenterName Openstack datacenter name
	DatacenterName string
	// in: header
	// ApplicationCredentialID application credential ID
	ApplicationCredentialID string
	// in: header
	// ApplicationCredentialSecret application credential Secret
	ApplicationCredentialSecret string
	// in: header
	// OIDCAuthentication when true use OIDC token
	OIDCAuthentication bool

	// in: header
	// Credential predefined Kubermatic credential name from the presets
	Credential string
}

func DecodeOpenstackReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req OpenstackReq

	req.Username = r.Header.Get("Username")
	req.Password = r.Header.Get("Password")
	req.Tenant = r.Header.Get("Tenant")
	req.TenantID = r.Header.Get("TenantID")
	req.Tenant = r.Header.Get("Project")
	req.TenantID = r.Header.Get("ProjectID")
	req.Domain = r.Header.Get("Domain")
	req.DatacenterName = r.Header.Get("DatacenterName")
	req.ApplicationCredentialID = r.Header.Get("ApplicationCredentialID")
	req.ApplicationCredentialSecret = r.Header.Get("ApplicationCredentialSecret")
	req.OIDCAuthentication = strings.EqualFold(r.Header.Get("OIDCAuthentication"), "true")
	req.Credential = r.Header.Get("Credential")
	return req, nil
}
