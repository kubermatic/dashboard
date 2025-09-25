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
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-kit/kit/endpoint"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/kubermatic/v2/pkg/resources"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/ptr"
)

func GetOpenstackAuthInfo(ctx context.Context, req OpenstackReq, projectID string, userInfoGetter provider.UserInfoGetter, presetProvider provider.PresetProvider) (*provider.UserInfo, *resources.OpenstackCredentials, error) {
	var cred resources.OpenstackCredentials
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return nil, nil, common.KubernetesErrorToHTTPError(err)
	}

	t := ctx.Value(middleware.RawTokenContextKey)
	token, ok := t.(string)
	if !ok || token == "" {
		return nil, nil, utilerrors.NewNotAuthorized()
	}

	// No preset is used
	presetName := req.Credential
	if presetName == "" {
		cred = resources.OpenstackCredentials{
			Username:                    req.Username,
			Password:                    req.Password,
			Project:                     req.GetProjectOrDefaultToTenant(),
			ProjectID:                   req.GetProjectIdOrDefaultToTenantId(),
			Domain:                      req.Domain,
			ApplicationCredentialID:     req.ApplicationCredentialID,
			ApplicationCredentialSecret: req.ApplicationCredentialSecret,
		}
		if req.OIDCAuthentication {
			cred.Token = token
		}
	} else {
		// Preset is used
		cred, err = getPresetCredentials(ctx, userInfo, presetName, projectID, presetProvider, token)
		if err != nil {
			return nil, nil, fmt.Errorf("error getting preset credentials for OpenStack: %w", err)
		}
	}

	return userInfo, &cred, nil
}

func getPresetCredentials(ctx context.Context, userInfo *provider.UserInfo, presetName string, projectID string, presetProvider provider.PresetProvider, token string) (resources.OpenstackCredentials, error) {
	p, err := presetProvider.GetPreset(ctx, userInfo, ptr.To(projectID), presetName)
	if err != nil {
		return resources.OpenstackCredentials{}, fmt.Errorf("can not get preset %s for user %s", presetName, userInfo.Email)
	}

	if p.Spec.Openstack == nil {
		return resources.OpenstackCredentials{}, fmt.Errorf("credentials for OpenStack provider not present in preset %s for the user %s", presetName, userInfo.Email)
	}

	credentials := resources.OpenstackCredentials{
		Username:                    p.Spec.Openstack.Username,
		Password:                    p.Spec.Openstack.Password,
		Project:                     p.Spec.Openstack.Project,
		ProjectID:                   p.Spec.Openstack.ProjectID,
		Domain:                      p.Spec.Openstack.Domain,
		ApplicationCredentialID:     p.Spec.Openstack.ApplicationCredentialID,
		ApplicationCredentialSecret: p.Spec.Openstack.ApplicationCredentialSecret,
	}

	if p.Spec.Openstack.UseToken {
		credentials.Token = token
	}

	return credentials, nil
}

func OpenstackSizeEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		datacenterName := req.DatacenterName
		_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
		if err != nil {
			return nil, fmt.Errorf("error getting dc: %w", err)
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		filter := handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)

		return providercommon.GetOpenstackSizes(cred, datacenter, filter, caBundle)
	}
}

func OpenstackAvailabilityZoneEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		datacenterName := req.DatacenterName
		_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
		if err != nil {
			return nil, fmt.Errorf("error getting dc: %w", err)
		}

		return providercommon.GetOpenstackAvailabilityZones(ctx, datacenter, cred, caBundle)
	}
}

func OpenstackNetworkEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		return providercommon.GetOpenstackNetworks(ctx, userInfo, seedsGetter, cred, req.DatacenterName, caBundle)
	}
}

func OpenstackSubnetsEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectSubnetReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		return providercommon.GetOpenstackSubnets(ctx, userInfo, seedsGetter, cred, req.NetworkID, req.DatacenterName, caBundle)
	}
}

func OpenstackSecurityGroupEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		return providercommon.GetOpenstackSecurityGroups(ctx, userInfo, seedsGetter, cred, req.DatacenterName, caBundle)
	}
}

func OpenstackTenantEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		reqTenant, ok := request.(OpenstackProjectTenantReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		// construct a pseudo req to get auth info
		req := OpenstackReq{
			Username:                    reqTenant.Username,
			Password:                    reqTenant.Password,
			Domain:                      reqTenant.Domain,
			OpenstackTenant:             "",
			OpenstackTenantID:           "",
			DatacenterName:              reqTenant.DatacenterName,
			ApplicationCredentialID:     reqTenant.ApplicationCredentialID,
			ApplicationCredentialSecret: reqTenant.ApplicationCredentialSecret,
			Credential:                  reqTenant.Credential,
			OIDCAuthentication:          reqTenant.OIDCAuthentication,
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req, reqTenant.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		return providercommon.GetOpenstackProjects(userInfo, seedsGetter, cred, reqTenant.DatacenterName, caBundle)
	}
}

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
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       OpenstackReq
			projectID string
		)

		if !withProject {
			openstackReq, ok := request.(OpenstackReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = openstackReq
		} else {
			openstackProjectReq, ok := request.(OpenstackProjectReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = openstackProjectReq.OpenstackReq
			projectID = openstackProjectReq.GetProjectID()
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req, projectID, userInfoGetter, presetProvider)
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
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool, withProject bool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		var (
			req       OpenstackSubnetPoolReq
			projectID string
		)

		if !withProject {
			subnetReq, ok := request.(OpenstackSubnetPoolReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = subnetReq
		} else {
			subnetProjectReq, ok := request.(OpenstackProjectSubnetPoolReq)
			if !ok {
				return nil, utilerrors.NewBadRequest("invalid request")
			}

			req = subnetProjectReq.OpenstackSubnetPoolReq
			projectID = subnetProjectReq.GetProjectID()
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, projectID, userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}
		return providercommon.GetOpenstackSubnetPools(ctx, userInfo, seedsGetter, cred, req.DatacenterName, req.IPVersion, caBundle)
	}
}

func OpenstackFloatingNetworksEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		return providercommon.GetOpenstackFloatingNetworks(ctx, userInfo, seedsGetter, cred, req.DatacenterName, caBundle)
	}
}

func OpenstackMemberSubnetsEndpoint(seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider,
	userInfoGetter provider.UserInfoGetter, caBundle *x509.CertPool) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(OpenstackProjectSubnetReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		networkID := req.NetworkID
		if networkID == "" {
			return nil, utilerrors.NewBadRequest("'network_id' query parameter is required")
		}

		userInfo, cred, err := GetOpenstackAuthInfo(ctx, req.OpenstackReq, req.GetProjectID(), userInfoGetter, presetProvider)
		if err != nil {
			return nil, err
		}

		loadbalancers, err := providercommon.GetOpenstackLoadBalancers(ctx, userInfo, seedsGetter, cred, req.DatacenterName, networkID, caBundle)
		if err != nil {
			return nil, err
		}

		out := make([]apiv2.OpenStackLoadBalancerPoolMember, 0)
		for _, lb := range loadbalancers {
			for _, pool := range lb.Pools {
				members, err := providercommon.GetOpenstackLoadBalancerPoolMembers(ctx, userInfo, seedsGetter, cred, req.DatacenterName, pool.ID, caBundle)
				if err != nil {
					return nil, err
				}
				b, err := json.Marshal(members)
				if err != nil {
					return nil, err
				}
				var m []apiv2.OpenStackLoadBalancerPoolMember
				if err := json.Unmarshal(b, &m); err != nil {
					return nil, err
				}
				out = append(out, m...)
			}
		}

		return out, nil
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
	OpenstackReq
	// in: query
	IPVersion int `json:"ip_version,omitempty"`
}

func DecodeOpenstackSubnetPoolReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req OpenstackSubnetPoolReq

	openstackReq, err := DecodeOpenstackReq(context.Background(), r)
	if err != nil {
		return nil, err
	}
	req.OpenstackReq = openstackReq.(OpenstackReq)

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
	// OpenstackTenant OpenStack tenant name (depreciated in favor of Project instead)
	OpenstackTenant string
	// in: header
	// OpenstackTenantID OpenStack tenant ID (depreciated in favor of  ProjectID instead)
	OpenstackTenantID string
	// in: header
	// OpenstackProject OpenStack project name
	OpenstackProject string
	// in: header
	// OpenstackProjectID OpenStack project ID
	OpenstackProjectID string
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

// GetProjectOrDefaultToTenant returns the the project if defined otherwise fallback to tenant.
func (r OpenstackReq) GetProjectOrDefaultToTenant() string {
	if len(r.OpenstackProject) > 0 {
		return r.OpenstackProject
	} else {
		return r.OpenstackTenant
	}
}

// GetProjectIdOrDefaultToTenantId returns the the projectID if defined otherwise fallback to tenantID.
func (r OpenstackReq) GetProjectIdOrDefaultToTenantId() string {
	if len(r.OpenstackProjectID) > 0 {
		return r.OpenstackProjectID
	} else {
		return r.OpenstackTenantID
	}
}

// OpenstackProjectReq represent a request for Openstack data within the context of a KKP project.
// swagger:parameters listProjectOpenstackSizes listProjectOpenstackAvailabilityZones listProjectOpenstackNetworks listProjectOpenstackSecurityGroups listProjectOpenstackServerGroups listProjectOpenstackExternalNetworks listProjectOpenstackFloatingNetworks
type OpenstackProjectReq struct {
	OpenstackReq
	common.ProjectReq
}

// OpenstackProjectSubnetPoolReq represent a request for openstack subnet pools within the context of a KKP project.
// swagger:parameters listProjectOpenstackSubnetPools
type OpenstackProjectSubnetPoolReq struct {
	OpenstackSubnetPoolReq
	common.ProjectReq
}

// OpenstackTenantReq represent a request for openstack tenants.
type OpenstackTenantReq struct {
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

// OpenstackProjectTenantReq represent a request for openstack tenants within the context of a KKP project.
// swagger:parameters listProjectOpenstackTenants
type OpenstackProjectTenantReq struct {
	OpenstackTenantReq
	common.ProjectReq
}

// OpenstackSubnetReq represent a request for openstack subnets.
type OpenstackSubnetReq struct {
	OpenstackReq
	// in: query
	NetworkID string `json:"network_id,omitempty"`
}

// OpenstackProjectSubnetReq represent a request for openstack subnets (or resources requiring a network_id) within the context of a KKP project.
// swagger:parameters listProjectOpenstackSubnets listProjectOpenstackSubnetTags listProjectOpenstackMemberSubnets
type OpenstackProjectSubnetReq struct {
	OpenstackSubnetReq
	common.ProjectReq
}

func DecodeOpenstackReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req OpenstackReq

	req.Username = r.Header.Get("Username")
	req.Password = r.Header.Get("Password")
	req.OpenstackTenant = r.Header.Get("Tenant")
	req.OpenstackTenantID = r.Header.Get("TenantID")
	req.OpenstackProject = r.Header.Get("OpenstackProject")
	req.OpenstackProjectID = r.Header.Get("OpenstackProjectID")
	req.Domain = r.Header.Get("Domain")
	req.DatacenterName = r.Header.Get("DatacenterName")
	req.ApplicationCredentialID = r.Header.Get("ApplicationCredentialID")
	req.ApplicationCredentialSecret = r.Header.Get("ApplicationCredentialSecret")
	req.OIDCAuthentication = strings.EqualFold(r.Header.Get("OIDCAuthentication"), "true")
	req.Credential = r.Header.Get("Credential")
	return req, nil
}

func DecodeOpenstackProjectReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	openstackReq, err := DecodeOpenstackReq(c, r)
	if err != nil {
		return nil, err
	}

	return OpenstackProjectReq{
		ProjectReq:   projectReq.(common.ProjectReq),
		OpenstackReq: openstackReq.(OpenstackReq),
	}, nil
}

func DecodeOpenstackProjectSubnetPoolReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	openstackReq, err := DecodeOpenstackSubnetPoolReq(c, r)
	if err != nil {
		return nil, err
	}

	return OpenstackProjectSubnetPoolReq{
		ProjectReq:             projectReq.(common.ProjectReq),
		OpenstackSubnetPoolReq: openstackReq.(OpenstackSubnetPoolReq),
	}, nil
}

func DecodeOpenstackTenantReq(_ context.Context, r *http.Request) (interface{}, error) {
	var req OpenstackTenantReq
	req.Username = r.Header.Get("Username")
	req.Password = r.Header.Get("Password")
	req.Domain = r.Header.Get("Domain")
	req.DatacenterName = r.Header.Get("DatacenterName")
	req.ApplicationCredentialID = r.Header.Get("ApplicationCredentialID")
	req.ApplicationCredentialSecret = r.Header.Get("ApplicationCredentialSecret")
	req.OIDCAuthentication = strings.EqualFold(r.Header.Get("OIDCAuthentication"), "true")
	req.Credential = r.Header.Get("Credential")
	return req, nil
}

func DecodeOpenstackProjectTenantReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	openstackReq, err := DecodeOpenstackTenantReq(c, r)
	if err != nil {
		return nil, err
	}

	return OpenstackProjectTenantReq{
		ProjectReq:         projectReq.(common.ProjectReq),
		OpenstackTenantReq: openstackReq.(OpenstackTenantReq),
	}, nil
}

func DecodeOpenstackSubnetReq(c context.Context, r *http.Request) (interface{}, error) {
	openstackReq, err := DecodeOpenstackReq(c, r)
	if err != nil {
		return nil, err
	}
	networkID := r.URL.Query().Get("network_id")
	if networkID == "" {
		return nil, fmt.Errorf("'network_id' is a required parameter and may not be empty")
	}

	return OpenstackSubnetReq{
		OpenstackReq: openstackReq.(OpenstackReq),
		NetworkID:    networkID,
	}, nil
}

func DecodeOpenstackProjectSubnetReq(c context.Context, r *http.Request) (interface{}, error) {
	projectReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	openstackReq, err := DecodeOpenstackSubnetReq(c, r)
	if err != nil {
		return nil, err
	}

	return OpenstackProjectSubnetReq{
		ProjectReq:         projectReq.(common.ProjectReq),
		OpenstackSubnetReq: openstackReq.(OpenstackSubnetReq),
	}, nil
}
