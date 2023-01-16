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
	"k8c.io/dashboard/v2/pkg/handler/v1/cluster"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

// RegisterV1Optional declares all router paths for v1.
func (r Routing) RegisterV1Optional(mux *mux.Router, oidcKubeConfEndpoint bool, oidcCfg authtypes.OIDCConfiguration, mainMux *mux.Router) {
	// if enabled exposes defines an endpoint for generating kubeconfig for a cluster that will contain OIDC tokens
	if oidcKubeConfEndpoint {
		mux.Methods(http.MethodGet).
			Path("/kubeconfig").
			Handler(r.createOIDCKubeconfig(oidcCfg))
	}
}

// swagger:route GET /api/v1/kubeconfig createOIDCKubeconfig
//
//	Starts OIDC flow and generates kubeconfig, the generated config
//	contains OIDC provider authentication info
//
//	Produces:
//	- application/json
//
//	Responses:
//	  default: errorResponse
//	  200: Kubeconfig
func (r Routing) createOIDCKubeconfig(oidcCfg authtypes.OIDCConfiguration) http.Handler {
	return httptransport.NewServer(
		endpoint.Chain(
			middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.SetPrivilegedClusterProvider(r.clusterProviderGetter, r.seedsGetter),
			middleware.UserInfoUnauthorized(r.userProjectMapper, r.userProvider),
			middleware.OIDCProviders(r.clusterProviderGetter, r.oidcIssuerVerifierGetter, r.seedsGetter),
		)(cluster.CreateOIDCKubeconfigEndpoint(
			r.projectProvider, r.privilegedProjectProvider, r.oidcIssuerVerifier, oidcCfg, r.seedsGetter,
		)),
		cluster.DecodeCreateOIDCKubeconfig,
		cluster.EncodeOIDCKubeconfig,
		r.defaultServerOptions()...,
	)
}
