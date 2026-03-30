/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package kubermaticdashboard

import (
	"net/http"

	"github.com/go-kit/kit/endpoint"
	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/gorilla/mux"

	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

// Handler defines the interface for registering auth routes.
type Handler interface {
	Install(*mux.Router)
	Middlewares(...endpoint.Middleware) Handler
	Options(...httptransport.ServerOption) Handler
}

type baseHandler struct {
	middlewares []endpoint.Middleware
	options     []httptransport.ServerOption
}

func (h *baseHandler) chain(ep endpoint.Endpoint) endpoint.Endpoint {
	for i := len(h.middlewares) - 1; i >= 0; i-- {
		ep = h.middlewares[i](ep)
	}
	return ep
}

type authHandler struct {
	baseHandler
	stateStore         authtypes.StateStore
	oidcIssuerVerifier authtypes.OIDCIssuerVerifier
}

func (a *authHandler) Middlewares(middlewares ...endpoint.Middleware) Handler {
	a.middlewares = middlewares
	return a
}

func (a *authHandler) Options(options ...httptransport.ServerOption) Handler {
	a.options = options
	return a
}

func (a *authHandler) Install(router *mux.Router) {
	router.Methods(http.MethodGet).
		Path("/auth/login").
		Handler(a.loginHandler())

	router.Methods(http.MethodGet).
		Path("/auth/callback").
		Handler(a.callbackHandler())

	router.Methods(http.MethodPost).
		Path("/auth/refresh").
		Handler(a.refreshHandler())

	router.Methods(http.MethodPost).
		Path("/auth/logout").
		Handler(a.logoutHandler())
}

// NewAuthHandler creates a new Handler for KKP dashboard authentication.
func NewAuthHandler(stateStore authtypes.StateStore, oidcIssuerVerifier authtypes.OIDCIssuerVerifier) Handler {
	return &authHandler{
		stateStore:         stateStore,
		oidcIssuerVerifier: oidcIssuerVerifier,
	}
}
