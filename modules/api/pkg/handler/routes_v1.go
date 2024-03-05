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

package handler

import (
	"net/http"

	"github.com/go-kit/kit/endpoint"
	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/gorilla/mux"

	"k8c.io/dashboard/v2/pkg/handler/middleware"
	v1 "k8c.io/dashboard/v2/pkg/handler/v1"
	"k8c.io/dashboard/v2/pkg/handler/v1/addon"
	admissionplugin "k8c.io/dashboard/v2/pkg/handler/v1/admission-plugin"
	"k8c.io/dashboard/v2/pkg/handler/v1/cluster"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/dc"
	"k8c.io/dashboard/v2/pkg/handler/v1/label"
	"k8c.io/dashboard/v2/pkg/handler/v1/node"
	"k8c.io/dashboard/v2/pkg/handler/v1/presets"
	"k8c.io/dashboard/v2/pkg/handler/v1/project"
	"k8c.io/dashboard/v2/pkg/handler/v1/seed"
	"k8c.io/dashboard/v2/pkg/handler/v1/serviceaccount"
	"k8c.io/dashboard/v2/pkg/handler/v1/ssh"
	"k8c.io/dashboard/v2/pkg/handler/v1/user"
)

// RegisterV1 declares all router paths for v1.
func (r Routing) RegisterV1(mux *mux.Router, metrics common.ServerMetrics) {
	//
	// no-op endpoint that always returns HTTP 200
	mux.Methods(http.MethodGet).
		Path("/healthz").
		HandlerFunc(statusOK)
	//
	// Defines endpoints for managing data centers
	mux.Methods(http.MethodGet).
		Path("/dc").
		Handler(r.datacentersHandler())

	mux.Methods(http.MethodGet).
		Path("/dc/{dc}").
		Handler(r.datacenterHandler())

	mux.Methods(http.MethodGet).
		Path("/seed/{seed_name}/dc").
		Handler(r.listDCForSeed())

	mux.Methods(http.MethodGet).
		Path("/seed/{seed_name}/dc/{dc}").
		Handler(r.getDCForSeed())

	mux.Methods(http.MethodPost).
		Path("/seed/{seed_name}/dc").
		Handler(r.createDC())

	mux.Methods(http.MethodPut).
		Path("/seed/{seed_name}/dc/{dc}").
		Handler(r.updateDC())

	mux.Methods(http.MethodPatch).
		Path("/seed/{seed_name}/dc/{dc}").
		Handler(r.patchDC())

	mux.Methods(http.MethodDelete).
		Path("/seed/{seed_name}/dc/{dc}").
		Handler(r.deleteDC())

	mux.Methods(http.MethodGet).
		Path("/providers/{provider_name}/dc").
		Handler(r.listDCForProvider())

	mux.Methods(http.MethodGet).
		Path("/providers/{provider_name}/dc/{dc}").
		Handler(r.getDCForProvider())

	//
	// Defines endpoints for interacting with seeds
	mux.Methods(http.MethodGet).
		Path("/seed").
		Handler(r.listSeedNames())

	mux.Methods(http.MethodGet).
		Path("/version").
		Handler(r.getKubermaticVersion())

	//
	// Defines a set of HTTP endpoints for project resource
	mux.Methods(http.MethodGet).
		Path("/projects").
		Handler(r.listProjects())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}").
		Handler(r.getProject())

	mux.Methods(http.MethodPost).
		Path("/projects").
		Handler(r.createProject())

	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}").
		Handler(r.updateProject())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}").
		Handler(r.deleteProject())

	//
	// Defines a set of HTTP endpoints for SSH Keys that belong to a project
	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/sshkeys").
		Handler(r.createSSHKey())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/sshkeys/{key_id}").
		Handler(r.deleteSSHKey())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/sshkeys").
		Handler(r.listSSHKeys())

	//
	// Defines a set of HTTP endpoints for cluster that belong to a project.
	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/clusters").
		Handler(r.listClustersForProject())

	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters").
		Handler(r.createCluster())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters").
		Handler(r.listClusters())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}").
		Handler(r.getCluster())

	mux.Methods(http.MethodPatch).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}").
		Handler(r.patchCluster())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/events").
		Handler(r.getClusterEvents())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/kubeconfig").
		Handler(r.getClusterKubeconfig())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/oidckubeconfig").
		Handler(r.getOidcClusterKubeconfig())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}").
		Handler(r.deleteCluster())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/health").
		Handler(r.getClusterHealth())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/upgrades").
		Handler(r.getClusterUpgrades())

	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodes/upgrades").
		Handler(r.upgradeClusterNodeDeployments())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/metrics").
		Handler(r.getClusterMetrics())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/namespaces").
		Handler(r.listNamespace())

	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles").
		Handler(r.createClusterRole())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles").
		Handler(r.listClusterRole())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterrolenames").
		Handler(r.listClusterRoleNames())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id}").
		Handler(r.getClusterRole())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id}").
		Handler(r.deleteClusterRole())

	mux.Methods(http.MethodPatch).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id}").
		Handler(r.patchClusterRole())

	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id}/clusterbindings").
		Handler(r.bindUserToClusterRole())

	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles").
		Handler(r.createRole())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles").
		Handler(r.listRole())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/rolenames").
		Handler(r.listRoleNames())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}").
		Handler(r.getRole())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}").
		Handler(r.deleteRole())

	mux.Methods(http.MethodPatch).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}").
		Handler(r.patchRole())

	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}/bindings").
		Handler(r.bindUserToRole())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}/bindings").
		Handler(r.unbindUserFromRoleBinding())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/bindings").
		Handler(r.listRoleBinding())

	//
	// Defines set of HTTP endpoints for SSH Keys that belong to a cluster
	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/sshkeys/{key_id}").
		Handler(r.assignSSHKeyToCluster())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/sshkeys").
		Handler(r.listSSHKeysAssignedToCluster())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/sshkeys/{key_id}").
		Handler(r.detachSSHKeyFromCluster())

	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/token").
		Handler(r.revokeClusterAdminToken())

	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/viewertoken").
		Handler(r.revokeClusterViewerToken())

	//
	// Defines a set of HTTP endpoint for node deployments that belong to a cluster
	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments").
		Handler(r.createNodeDeployment())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments").
		Handler(r.listNodeDeployments())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}").
		Handler(r.getNodeDeployment())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}/nodes").
		Handler(r.listNodeDeploymentNodes())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}/nodes/metrics").
		Handler(r.listNodeDeploymentMetrics())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}/nodes/events").
		Handler(r.listNodeDeploymentNodesEvents())

	mux.Methods(http.MethodPatch).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}").
		Handler(r.patchNodeDeployment())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}").
		Handler(r.deleteNodeDeployment())

	//
	// Defines a set of HTTP endpoints for managing addons
	mux.Methods(http.MethodGet).
		Path("/addons").
		Handler(r.listAccessibleAddons())

	mux.Methods(http.MethodGet).
		Path("/addonconfigs/{addon_id}").
		Handler(r.getAddonConfig())

	mux.Methods(http.MethodGet).
		Path("/addonconfigs").
		Handler(r.listAddonConfigs())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/installableaddons").
		Handler(r.listInstallableAddons())

	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons").
		Handler(r.createAddon())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons").
		Handler(r.listAddons())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons/{addon_id}").
		Handler(r.getAddon())

	mux.Methods(http.MethodPatch).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons/{addon_id}").
		Handler(r.patchAddon())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons/{addon_id}").
		Handler(r.deleteAddon())

		//
	// Defines set of HTTP endpoints for Users of the given project
	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/users").
		Handler(r.addUserToProject())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/users").
		Handler(r.getUsersForProject())

	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/users/{user_id}").
		Handler(r.editUserInProject())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/users/{user_id}").
		Handler(r.deleteUserFromProject())

	//
	// Defines set of HTTP endpoints for ServiceAccounts of the given project
	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/serviceaccounts").
		Handler(r.addServiceAccountToProject())

	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/serviceaccounts").
		Handler(r.listServiceAccounts())

	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}").
		Handler(r.updateServiceAccount())

	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}").
		Handler(r.deleteServiceAccount())

	//
	// Defines set of HTTP endpoints for tokens of the given service account
	mux.Methods(http.MethodPost).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens").
		Handler(r.addTokenToServiceAccount())
	mux.Methods(http.MethodGet).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens").
		Handler(r.listServiceAccountTokens())
	mux.Methods(http.MethodPut).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens/{token_id}").
		Handler(r.updateServiceAccountToken())
	mux.Methods(http.MethodPatch).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens/{token_id}").
		Handler(r.patchServiceAccountToken())
	mux.Methods(http.MethodDelete).
		Path("/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens/{token_id}").
		Handler(r.deleteServiceAccountToken())

	//
	// Defines set of HTTP endpoints for control plane and kubelet versions
	mux.Methods(http.MethodGet).
		Path("/upgrades/cluster").
		Handler(r.getMasterVersions())

	mux.Methods(http.MethodGet).
		Path("/upgrades/node").
		Handler(r.getNodeUpgrades())

	//
	// Defines an endpoint to retrieve information about the current token owner
	mux.Methods(http.MethodGet).
		Path("/me").
		Handler(r.getCurrentUser())

	mux.Methods(http.MethodPost).
		Path("/me/logout").
		Handler(r.logoutCurrentUser())

	mux.Methods(http.MethodGet).
		Path("/me/settings").
		Handler(r.getCurrentUserSettings())

	mux.Methods(http.MethodPatch).
		Path("/me/settings").
		Handler(r.patchCurrentUserSettings())

	mux.Methods(http.MethodGet).
		Path("/labels/system").
		Handler(r.listSystemLabels())

	//
	// Defines an endpoint to retrieve information about admission plugins
	mux.Methods(http.MethodGet).
		Path("/admission/plugins/{version}").
		Handler(r.getAdmissionPlugins())

	mux.Methods(http.MethodGet).
		Path("/providers/{provider_name}/presets/credentials").
		Handler(r.listCredentials())
}

// swagger:route GET /api/v1/projects/{project_id}/sshkeys project listSSHKeys
//
//	Lists SSH Keys that belong to the given project.
//	The returned collection is sorted by creation timestamp.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []SSHKey
//	  401: empty
//	  403: empty
func (r Routing) listSSHKeys() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(ssh.ListEndpoint(r.sshKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		ssh.DecodeListReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/sshkeys project createSSHKey
//
//	Adds the given SSH key to the specified project.
//
//	 Consumes:
//	 - application/json
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   201: SSHKey
//	   401: empty
//	   403: empty
func (r Routing) createSSHKey() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(ssh.CreateEndpoint(r.sshKeyProvider, r.privilegedSSHKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		ssh.DecodeCreateReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/sshkeys/{key_id} project deleteSSHKey
//
//	Removes the given SSH Key from the system.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteSSHKey() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(ssh.DeleteEndpoint(r.sshKeyProvider, r.privilegedSSHKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		ssh.DecodeDeleteReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/dc datacenter listDatacenters
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: DatacenterList
func (r Routing) datacentersHandler() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.ListEndpoint(r.seedsGetter, r.userInfoGetter)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// Get the datacenter
// swagger:route GET /api/v1/dc/{dc} datacenter getDatacenter
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Datacenter
func (r Routing) datacenterHandler() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.GetEndpoint(r.seedsGetter, r.userInfoGetter)),
		dc.DecodeLegacyDcReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/providers/{provider_name}/dc datacenter listDCForProvider
//
//	Returns all datacenters for the specified provider.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Datacenter
//	  401: empty
//	  403: empty
func (r Routing) listDCForProvider() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.ListEndpointForProvider(r.seedsGetter, r.userInfoGetter)),
		dc.DecodeForProviderDCListReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/providers/{provider_name}/dc/{dc} datacenter getDCForProvider
//
//	Get the datacenter for the specified provider.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Datacenter
//	  401: empty
//	  403: empty
func (r Routing) getDCForProvider() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.GetEndpointForProvider(r.seedsGetter, r.userInfoGetter)),
		dc.DecodeForProviderDCGetReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/seed/{seed_name}/dc datacenter listDCForSeed
//
//	Returns all datacenters for the specified seed.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Datacenter
//	  401: empty
//	  403: empty
func (r Routing) listDCForSeed() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.ListEndpointForSeed(r.seedsGetter, r.userInfoGetter)),
		dc.DecodeListDCForSeedReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/seed/{seed_name}/dc/{dc} datacenter getDCForSeed
//
//	Returns the specified datacenter for the specified seed.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Datacenter
//	  401: empty
//	  403: empty
func (r Routing) getDCForSeed() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.GetEndpointForSeed(r.seedsGetter, r.userInfoGetter)),
		dc.DecodeGetDCForSeedReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/seed/{seed_name}/dc datacenter createDC
//
//	Create the datacenter for a specified seed.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: Datacenter
//	  401: empty
//	  403: empty
func (r Routing) createDC() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.CreateEndpoint(r.seedsGetter, r.userInfoGetter, r.masterClient)),
		dc.DecodeCreateDCReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/seed/{seed_name}/dc/{dc} datacenter updateDC
//
//	Update the datacenter. The datacenter spec will be overwritten with the one provided in the request.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Datacenter
//	  401: empty
//	  403: empty
func (r Routing) updateDC() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.UpdateEndpoint(r.seedsGetter, r.userInfoGetter, r.masterClient)),
		dc.DecodeUpdateDCReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/seed/{seed_name}/dc/{dc} datacenter patchDC
//
//	Patch the datacenter.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Datacenter
//	  401: empty
//	  403: empty
func (r Routing) patchDC() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.PatchEndpoint(r.seedsGetter, r.userInfoGetter, r.masterClient)),
		dc.DecodePatchDCReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/seed/{seed_name}/dc/{dc} datacenter deleteDC
//
//	Delete the datacenter.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteDC() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(dc.DeleteEndpoint(r.seedsGetter, r.userInfoGetter, r.masterClient)),
		dc.DecodeDeleteDCReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/seed seed listSeedNames
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: SeedNamesList
func (r Routing) listSeedNames() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(seed.ListSeedNamesEndpoint(r.seedsGetter)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/versions versions getMasterVersions
// swagger:route GET /api/v1/upgrades/cluster versions getMasterVersions
//
// Lists all versions which don't result in automatic updates
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []MasterVersion
func (r Routing) getMasterVersions() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(cluster.GetMasterVersionsEndpoint(r.kubermaticConfigGetter)),
		cluster.DecodeClusterTypeReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/version versions getKubermaticVersion
//
// Get versions of running Kubermatic components.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: KubermaticVersions
func (r Routing) getKubermaticVersion() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(v1.GetKubermaticVersion(r.versions)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects project listProjects
//
//	Lists projects that an authenticated user is a member of.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Project
//	  401: empty
//	  409: empty
func (r Routing) listProjects() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(project.ListEndpoint(r.userInfoGetter, r.projectProvider, r.privilegedProjectProvider, r.userProjectMapper, r.projectMemberProvider, r.userProvider, r.clusterProviderGetter, r.seedsGetter)),
		project.DecodeList,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id} project getProject
//
//	Gets the project with the given ID
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Project
//	  401: empty
//	  409: empty
func (r Routing) getProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(project.GetEndpoint(r.projectProvider, r.privilegedProjectProvider, r.projectMemberProvider, r.userProvider, r.userInfoGetter, r.clusterProviderGetter, r.seedsGetter)),
		common.DecodeGetProject,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects project createProject
//
//	Creates a brand new project.
//
//	Note that this endpoint can be consumed by every authenticated user.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: Project
//	  401: empty
//	  409: empty
func (r Routing) createProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(project.CreateEndpoint(r.projectProvider, r.privilegedProjectProvider, r.settingsProvider, r.userProjectMapper, r.projectMemberProvider, r.privilegedProjectMemberProvider, r.userProvider)),
		project.DecodeCreate,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id} project updateProject
//
//	Updates the given project
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: Project
//	   400: empty
//	   404: empty
//	   500: empty
//	   501: empty
func (r Routing) updateProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(project.UpdateEndpoint(r.projectProvider, r.privilegedProjectProvider, r.projectMemberProvider, r.userProvider, r.userInfoGetter, r.clusterProviderGetter, r.seedsGetter)),
		project.DecodeUpdateRq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id} project deleteProject
//
//	Deletes the project with the given ID.
//
//	 Produces:
//	 - application/json
//
//
//	 Responses:
//	   default: errorResponse
//	   200: empty
//	   401: empty
//	   403: empty
func (r Routing) deleteProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(project.DeleteEndpoint(r.projectProvider, r.settingsProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		project.DecodeDelete,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters project createCluster
//
//	Creates a cluster for the given project.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: Cluster
//	  401: empty
//	  403: empty
func (r Routing) createCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.CreateEndpoint(r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.presetProvider,
			r.exposeStrategy, r.userInfoGetter, r.settingsProvider, r.caBundle, r.kubermaticConfigGetter, r.features)),
		cluster.DecodeCreateReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters project listClusters
//
//	Lists clusters for the specified project and data center.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ClusterList
//	  401: empty
//	  403: empty
func (r Routing) listClusters() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListEndpoint(r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.userInfoGetter, r.kubermaticConfigGetter)),
		cluster.DecodeListReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/clusters project listClustersForProject
//
//	Lists clusters for the specified project.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ClusterList
//	  401: empty
//	  403: empty
func (r Routing) listClustersForProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(cluster.ListAllEndpoint(r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.clusterProviderGetter, r.userInfoGetter, r.kubermaticConfigGetter)),
		common.DecodeGetProject,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id} project getCluster
//
//	Gets the cluster with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Cluster
//	  401: empty
//	  403: empty
func (r Routing) getCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetEndpoint(r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.userInfoGetter, r.kubermaticConfigGetter)),
		common.DecodeGetClusterReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id} project patchCluster
//
//	Patches the given cluster using JSON Merge Patch method (https://tools.ietf.org/html/rfc7396).
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Cluster
//	  401: empty
//	  403: empty
func (r Routing) patchCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.PatchEndpoint(r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.userInfoGetter, r.caBundle, r.kubermaticConfigGetter, r.features)),
		cluster.DecodePatchReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// getClusterEvents returns events related to the cluster.
// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/events project getClusterEvents
//
//	Gets the events related to the specified cluster.
//
//	Produces:
//	- application/yaml
//
//	Responses:
//	  default: errorResponse
//	  200: []Event
//	  401: empty
//	  403: empty
func (r Routing) getClusterEvents() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetClusterEventsEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeGetClusterEvents,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// getClusterKubeconfig returns the kubeconfig for the cluster.
// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/kubeconfig project getClusterKubeconfig
//
//	Gets the kubeconfig for the specified cluster.
//
//	Produces:
//	- application/octet-stream
//
//	Responses:
//	  default: errorResponse
//	  200: Kubeconfig
//	  401: empty
//	  403: empty
func (r Routing) getClusterKubeconfig() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetAdminKubeconfigEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter, r.settingsProvider)),
		cluster.DecodeGetAdminKubeconfig,
		cluster.EncodeKubeconfig,
		r.defaultServerOptions()...,
	)
}

// getOidcClusterKubeconfig returns the oidc kubeconfig for the cluster.
// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/oidckubeconfig project getOidcClusterKubeconfig
//
//	Gets the kubeconfig for the specified cluster with oidc authentication.
//
//	Produces:
//	- application/yaml
//
//	Responses:
//	  default: errorResponse
//	  200: Kubeconfig
//	  401: empty
//	  403: empty
func (r Routing) getOidcClusterKubeconfig() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetOidcKubeconfigEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeGetAdminKubeconfig,
		cluster.EncodeKubeconfig,
		r.defaultServerOptions()...,
	)
}

// Delete the cluster
// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id} project deleteCluster
//
//	Deletes the specified cluster
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.DeleteEndpoint(r.sshKeyProvider, r.privilegedSSHKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeDeleteReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/health project getClusterHealth
//
//	Returns the cluster's component health status
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ClusterHealth
//	  401: empty
//	  403: empty
func (r Routing) getClusterHealth() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.HealthEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		common.DecodeGetClusterReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/sshkeys/{key_id} project assignSSHKeyToCluster
//
//	Assigns an existing ssh key to the given cluster
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: SSHKey
//	  401: empty
//	  403: empty
func (r Routing) assignSSHKeyToCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.AssignSSHKeyEndpoint(r.sshKeyProvider, r.privilegedSSHKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeAssignSSHKeyReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/sshkeys project listSSHKeysAssignedToCluster
//
//	Lists ssh keys that are assigned to the cluster
//	The returned collection is sorted by creation timestamp.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []SSHKey
//	  401: empty
//	  403: empty
func (r Routing) listSSHKeysAssignedToCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListSSHKeysEndpoint(r.sshKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeListSSHKeysReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/sshkeys/{key_id} project detachSSHKeyFromCluster
//
//	Unassignes an ssh key from the given cluster
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) detachSSHKeyFromCluster() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.DetachSSHKeyEndpoint(r.sshKeyProvider, r.privilegedSSHKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeDetachSSHKeysReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/token project revokeClusterAdminToken
//
//	Revokes the current admin token
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) revokeClusterAdminToken() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.RevokeAdminTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeAdminTokenReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/viewertoken project revokeClusterViewerToken
//
//	Revokes the current viewer token
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) revokeClusterViewerToken() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.RevokeViewerTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeAdminTokenReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/upgrades project getClusterUpgrades
//
//	Gets possible cluster upgrades
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: []MasterVersion
//	   401: empty
//	   403: empty
func (r Routing) getClusterUpgrades() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetUpgradesEndpoint(r.kubermaticConfigGetter, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		common.DecodeGetClusterReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/upgrades/node versions getNodeUpgrades
//
//	Gets possible node upgrades for a specific control plane version
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: []MasterVersion
//	   401: empty
//	   403: empty
func (r Routing) getNodeUpgrades() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(cluster.GetNodeUpgrades(r.kubermaticConfigGetter)),
		cluster.DecodeNodeUpgradesReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodes/upgrades project upgradeClusterNodeDeployments
//
//	Upgrades node deployments in a cluster
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: empty
//	   401: empty
//	   403: empty
func (r Routing) upgradeClusterNodeDeployments() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.UpgradeNodeDeploymentsEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeUpgradeNodeDeploymentsReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/users users addUserToProject
//
//	Adds the given user to the given project
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: User
//	  401: empty
//	  403: empty
func (r Routing) addUserToProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.AddEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userProvider, r.projectMemberProvider, r.privilegedProjectMemberProvider, r.userInfoGetter)),
		user.DecodeAddReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/users users getUsersForProject
//
//	Get list of users for the given project
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []User
//	  401: empty
//	  403: empty
func (r Routing) getUsersForProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.ListEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userProvider, r.projectMemberProvider, r.userInfoGetter)),
		common.DecodeGetProject,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/users/{user_id} users editUserInProject
//
//	Changes membership of the given user for the given project
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: User
//	  401: empty
//	  403: empty
func (r Routing) editUserInProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.EditEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userProvider, r.projectMemberProvider, r.privilegedProjectMemberProvider, r.userInfoGetter)),
		user.DecodeEditReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/users/{user_id} users deleteUserFromProject
//
//	Removes the given member from the project
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: User
//	  401: empty
//	  403: empty
func (r Routing) deleteUserFromProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.DeleteEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userProvider, r.projectMemberProvider, r.privilegedProjectMemberProvider, r.userInfoGetter)),
		user.DecodeDeleteReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/me users getCurrentUser
//
//	Returns information about the current user.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: User
//	  401: empty
func (r Routing) getCurrentUser() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.GetEndpoint(r.userProjectMapper)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/me/logout users logoutCurrentUser
//
//	Adds current authorization bearer token to the blacklist.
//	Enforces user to login again with the new token.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
func (r Routing) logoutCurrentUser() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.LogoutEndpoint(r.userProvider)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/me/settings settings getCurrentUserSettings
//
//	Returns settings of the current user.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: UserSettings
//	  401: empty
func (r Routing) getCurrentUserSettings() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.GetSettingsEndpoint(r.userProjectMapper)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/me/settings settings patchCurrentUserSettings
//
//	    Updates settings of the current user.
//
//		   Consumes:
//	    - application/json
//
//	    Produces:
//	    - application/json
//
//	    Responses:
//	      default: errorResponse
//	      200: UserSettings
//	      401: empty
func (r Routing) patchCurrentUserSettings() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(user.PatchSettingsEndpoint(r.userProvider)),
		user.DecodePatchSettingsReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/serviceaccounts serviceaccounts addServiceAccountToProject
//
//	Adds the given service account to the given project
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: ServiceAccount
//	  401: empty
//	  403: empty
func (r Routing) addServiceAccountToProject() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.CreateEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.userInfoGetter)),
		serviceaccount.DecodeAddReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/serviceaccounts serviceaccounts listServiceAccounts
//
//	List Service Accounts for the given project
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []ServiceAccount
//	  401: empty
//	  403: empty
func (r Routing) listServiceAccounts() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.ListEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.userProjectMapper, r.userInfoGetter)),
		common.DecodeGetProject,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id} serviceaccounts updateServiceAccount
//
//	Updates service account for the given project
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ServiceAccount
//	  401: empty
//	  403: empty
func (r Routing) updateServiceAccount() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.UpdateEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.userProjectMapper, r.userInfoGetter)),
		serviceaccount.DecodeUpdateReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id} serviceaccounts deleteServiceAccount
//
//	Deletes service account for the given project
//
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteServiceAccount() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.DeleteEndpoint(r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		serviceaccount.DecodeDeleteReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens tokens addTokenToServiceAccount
//
//	Generates a token for the given service account
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: ServiceAccountToken
//	  401: empty
//	  403: empty
func (r Routing) addTokenToServiceAccount() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.CreateTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.serviceAccountTokenProvider, r.privilegedServiceAccountTokenProvider, r.saTokenAuthenticator, r.saTokenGenerator, r.userInfoGetter)),
		serviceaccount.DecodeAddTokenReq,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens tokens listServiceAccountTokens
//
//	List tokens for the given service account
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []PublicServiceAccountToken
//	  401: empty
//	  403: empty
func (r Routing) listServiceAccountTokens() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.ListTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.serviceAccountTokenProvider, r.privilegedServiceAccountTokenProvider, r.saTokenAuthenticator, r.userInfoGetter)),
		serviceaccount.DecodeTokenReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PUT /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens/{token_id} tokens updateServiceAccountToken
//
//	Updates and regenerates the token
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ServiceAccountToken
//	  401: empty
//	  403: empty
func (r Routing) updateServiceAccountToken() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.UpdateTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.serviceAccountTokenProvider, r.privilegedServiceAccountTokenProvider, r.saTokenAuthenticator, r.saTokenGenerator, r.userInfoGetter)),
		serviceaccount.DecodeUpdateTokenReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens/{token_id} tokens patchServiceAccountToken
//
//	Patches the token name
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: PublicServiceAccountToken
//	  401: empty
//	  403: empty
func (r Routing) patchServiceAccountToken() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.PatchTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.serviceAccountTokenProvider, r.privilegedServiceAccountTokenProvider, r.saTokenAuthenticator, r.saTokenGenerator, r.userInfoGetter)),
		serviceaccount.DecodePatchTokenReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/serviceaccounts/{serviceaccount_id}/tokens/{token_id} tokens deleteServiceAccountToken
//
//	Deletes the token
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteServiceAccountToken() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(serviceaccount.DeleteTokenEndpoint(r.projectProvider, r.privilegedProjectProvider, r.serviceAccountProvider, r.privilegedServiceAccountProvider, r.serviceAccountTokenProvider, r.privilegedServiceAccountTokenProvider, r.userInfoGetter)),
		serviceaccount.DecodeDeleteTokenReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments project createNodeDeployment
//
//	Creates a node deployment that will belong to the given cluster
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: NodeDeployment
//	  401: empty
//	  403: empty
func (r Routing) createNodeDeployment() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.CreateNodeDeployment(r.sshKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.userInfoGetter, r.settingsProvider)),
		node.DecodeCreateNodeDeployment,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments project listNodeDeployments
//
//	Lists node deployments that belong to the given cluster
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []NodeDeployment
//	  401: empty
//	  403: empty
func (r Routing) listNodeDeployments() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.ListNodeDeployments(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		node.DecodeListNodeDeployments,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id} project getNodeDeployment
//
//	Gets a node deployment that is assigned to the given cluster.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: NodeDeployment
//	  401: empty
//	  403: empty
func (r Routing) getNodeDeployment() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.GetNodeDeployment(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		node.DecodeGetNodeDeployment,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}/nodes project listNodeDeploymentNodes
//
//	Lists nodes that belong to the given node deployment.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Node
//	  401: empty
//	  403: empty
func (r Routing) listNodeDeploymentNodes() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.ListNodeDeploymentNodes(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		node.DecodeListNodeDeploymentNodes,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}/nodes/metrics metric listNodeDeploymentMetrics
//
//	Lists metrics that belong to the given node deployment.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []NodeMetric
//	  401: empty
//	  403: empty
func (r Routing) listNodeDeploymentMetrics() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.ListNodeDeploymentMetrics(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		node.DecodeListNodeDeploymentMetrics,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id}/nodes/events project listNodeDeploymentNodesEvents
//
//	Lists node deployment events. If query parameter `type` is set to `warning` then only warning events are retrieved.
//	If the value is 'normal' then normal events are returned. If the query parameter is missing method returns all events.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Event
//	  401: empty
//	  403: empty
func (r Routing) listNodeDeploymentNodesEvents() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.ListNodeDeploymentNodesEvents(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		node.DecodeListNodeDeploymentNodesEvents,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id} project patchNodeDeployment
//
//	    Patches a node deployment that is assigned to the given cluster. Please note that at the moment only
//		   node deployment's spec can be updated by a patch, no other fields can be changed using this endpoint.
//
//	    Consumes:
//	    - application/json
//
//	    Produces:
//	    - application/json
//
//	    Responses:
//	      default: errorResponse
//	      200: NodeDeployment
//	      401: empty
//	      403: empty
func (r Routing) patchNodeDeployment() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.PatchNodeDeployment(r.sshKeyProvider, r.projectProvider, r.privilegedProjectProvider, r.seedsGetter, r.userInfoGetter, r.settingsProvider)),
		node.DecodePatchNodeDeployment,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/nodedeployments/{nodedeployment_id} project deleteNodeDeployment
//
//	Deletes the given node deployment that belongs to the cluster.
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: empty
//	   401: empty
//	   403: empty
func (r Routing) deleteNodeDeployment() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(node.DeleteNodeDeployment(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		node.DecodeDeleteNodeDeployment,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/addons addon listAccessibleAddons
//
//	Lists names of addons that can be configured inside the user clusters
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: AccessibleAddons
//	  401: empty
//	  403: empty
func (r Routing) listAccessibleAddons() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(addon.ListAccessibleAddons(r.kubermaticConfigGetter)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/installableaddons addon listInstallableAddons
//
//	Lists names of addons that can be installed inside the user cluster
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: AccessibleAddons
//	  401: empty
//	  403: empty
func (r Routing) listInstallableAddons() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.Addons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
			middleware.PrivilegedAddons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
		)(addon.ListInstallableAddonEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter, r.kubermaticConfigGetter)),
		addon.DecodeListAddons,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons addon createAddon
//
//	Creates an addon that will belong to the given cluster
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  201: Addon
//	  401: empty
//	  403: empty
func (r Routing) createAddon() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.Addons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
			middleware.PrivilegedAddons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
		)(addon.CreateAddonEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		addon.DecodeCreateAddon,
		SetStatusCreatedHeader(EncodeJSON),
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons addon listAddons
//
//	Lists addons that belong to the given cluster
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Addon
//	  401: empty
//	  403: empty
func (r Routing) listAddons() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.Addons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
			middleware.PrivilegedAddons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
		)(addon.ListAddonEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		addon.DecodeListAddons,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons/{addon_id} addon getAddon
//
//	Gets an addon that is assigned to the given cluster.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Addon
//	  401: empty
//	  403: empty
func (r Routing) getAddon() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.Addons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
			middleware.PrivilegedAddons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
		)(addon.GetAddonEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		addon.DecodeGetAddon,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons/{addon_id} addon patchAddon
//
//	Patches an addon that is assigned to the given cluster.
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Addon
//	  401: empty
//	  403: empty
func (r Routing) patchAddon() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.Addons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
			middleware.PrivilegedAddons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
		)(addon.PatchAddonEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		addon.DecodePatchAddon,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/addons/{addon_id} addon deleteAddon
//
//	Deletes the given addon that belongs to the cluster.
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: empty
//	   401: empty
//	   403: empty
func (r Routing) deleteAddon() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.Addons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
			middleware.PrivilegedAddons(r.clusterProviderGetter, r.addonProviderGetter, r.seedsGetter),
		)(addon.DeleteAddonEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		addon.DecodeGetAddon,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/metrics project getClusterMetrics
//
//	Gets cluster metrics
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: ClusterMetrics
//	   401: empty
//	   403: empty
func (r Routing) getClusterMetrics() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetMetricsEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		common.DecodeGetClusterReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles project createClusterRole
//
//	Creates cluster role
//
//	 Consumes:
//	 - application/json
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   201: ClusterRole
//	   401: empty
//	   403: empty
func (r Routing) createClusterRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.CreateClusterRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeCreateClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles project createRole
//
//	Creates cluster role
//
//	 Consumes:
//	 - application/json
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   201: Role
//	   401: empty
//	   403: empty
func (r Routing) createRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.CreateRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeCreateRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles project listClusterRole
//
//	Lists all ClusterRoles
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []ClusterRole
//	  401: empty
//	  403: empty
func (r Routing) listClusterRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListClusterRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeListClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterrolenames project listClusterRoleNames
//
//	Lists all ClusterRoles
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []ClusterRoleName
//	  401: empty
//	  403: empty
func (r Routing) listClusterRoleNames() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListClusterRoleNamesEndpoint(r.userInfoGetter)),
		cluster.DecodeListClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles project listRole
//
//	Lists all Roles
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Role
//	  401: empty
//	  403: empty
func (r Routing) listRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeListClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/rolenames project listRoleNames
//
//	Lists all Role names with namespaces
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []RoleName
//	  401: empty
//	  403: empty
func (r Routing) listRoleNames() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListRoleNamesEndpoint(r.userInfoGetter)),
		cluster.DecodeListClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{role_id} project getClusterRole
//
//	Gets the cluster role with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ClusterRole
//	  401: empty
//	  403: empty
func (r Routing) getClusterRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetClusterRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeGetClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id} project getRole
//
//	Gets the role with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Role
//	  401: empty
//	  403: empty
func (r Routing) getRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.GetRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeGetRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id} project deleteClusterRole
//
//	Delete the cluster role with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteClusterRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.DeleteClusterRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeGetClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id} project deleteRole
//
//	Delete the cluster role with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: empty
//	  401: empty
//	  403: empty
func (r Routing) deleteRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.DeleteRoleEndpoint(r.userInfoGetter)),
		cluster.DecodeGetRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/namespaces project listNamespace
//
//	Lists all namespaces in the cluster
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []Namespace
//	  401: empty
//	  403: empty
func (r Routing) listNamespace() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListNamespaceEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		common.DecodeGetClusterReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id} project patchRole
//
//	Patch the role with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Role
//	  401: empty
//	  403: empty
func (r Routing) patchRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.PatchRoleEndpoint(r.userInfoGetter)),
		cluster.DecodePatchRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route PATCH /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id} project patchClusterRole
//
//	Patch the cluster role with the given name
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: ClusterRole
//	  401: empty
//	  403: empty
func (r Routing) patchClusterRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.PatchClusterRoleEndpoint(r.userInfoGetter)),
		cluster.DecodePatchClusterRoleReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}/bindings project bindUserToRole
//
//	Binds user to the role
//
//	 Consumes:
//	 - application/json
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: RoleBinding
//	   401: empty
//	   403: empty
func (r Routing) bindUserToRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.BindUserToRoleEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeRoleUserReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route DELETE /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/roles/{namespace}/{role_id}/bindings project unbindUserFromRoleBinding
//
//	Unbinds user from the role binding
//
//	 Consumes:
//	 - application/json
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: RoleBinding
//	   401: empty
//	   403: empty
func (r Routing) unbindUserFromRoleBinding() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.UnbindUserFromRoleBindingEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeRoleUserReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/bindings project listRoleBinding
//
//	List role binding
//
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: []RoleBinding
//	   401: empty
//	   403: empty
func (r Routing) listRoleBinding() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.ListRoleBindingEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeListBindingReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route POST /api/v1/projects/{project_id}/dc/{dc}/clusters/{cluster_id}/clusterroles/{role_id}/clusterbindings project bindUserToClusterRole
//
//	Binds user to cluster role
//
//	 Consumes:
//	 - application/json
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: ClusterRoleBinding
//	   401: empty
//	   403: empty
func (r Routing) bindUserToClusterRole() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
		)(cluster.BindUserToClusterRoleEndpoint(r.projectProvider, r.privilegedProjectProvider, r.userInfoGetter)),
		cluster.DecodeClusterRoleUserReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/labels/system listSystemLabels
//
//	List restricted system labels
//
//
//	 Produces:
//	 - application/json
//
//	 Responses:
//	   default: errorResponse
//	   200: ResourceLabelMap
//	   401: empty
//	   403: empty
func (r Routing) listSystemLabels() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
		)(label.ListSystemLabels()),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/addonconfigs/{addon_id} getAddonConfig
//
//	Returns specified addon config.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: AddonConfig
//	  401: empty
func (r Routing) getAddonConfig() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(addon.GetAddonConfigEndpoint(r.addonConfigProvider)),
		addon.DecodeGetConfig,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/addonconfigs listAddonConfigs
//
//	Returns all available addon configs.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: []AddonConfig
//	  401: empty
func (r Routing) listAddonConfigs() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(addon.ListAddonConfigsEndpoint(r.addonConfigProvider)),
		common.DecodeEmptyReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/admission/plugins/{version} getAdmissionPlugins
//
//	Returns specified addon config.
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: AdmissionPluginList
//	  401: empty
func (r Routing) getAdmissionPlugins() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(admissionplugin.GetAdmissionPluginEndpoint(r.admissionPluginProvider)),
		admissionplugin.DecodeGetAdmissionPlugin,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}

// swagger:route GET /api/v1/providers/{provider_name}/presets/credentials credentials listCredentials
//
// Lists credential names for the provider
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: CredentialList
func (r Routing) listCredentials() http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.TokenVerifier(r.tokenVerifiers, r.userProvider),
			middleware.UserSaver(r.userProvider),
		)(presets.CredentialEndpoint(r.presetProvider, r.userInfoGetter)),
		presets.DecodeProviderReq,
		EncodeJSON,
		r.defaultServerOptions()...,
	)
}
