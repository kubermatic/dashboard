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

package kubernetesdashboard

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/go-kit/kit/endpoint"
	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"

	commonv2 "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/apimachinery/pkg/util/rand"
)

const (
	nonceCookieName   = "nonce"
	nonceCookieMaxAge = 180
)

type loginHandler struct {
	baseHandler

	settingsProvider provider.SettingsProvider
}

func (l *loginHandler) Middlewares(middlewares ...endpoint.Middleware) Handler {
	l.middlewares = middlewares
	return l
}

func (l *loginHandler) Options(options ...httptransport.ServerOption) Handler {
	l.options = options
	return l
}

func (l *loginHandler) Install(router *mux.Router) {
	router.Methods(http.MethodGet).
		Path("/dashboard/login").
		Queries("projectID", "{projectID}", "clusterID", "{clusterID}").
		Handler(l.redirectHandler())

	router.Methods(http.MethodGet).
		Path("/dashboard/login").
		Queries("state", "{state}", "code", "{code}").
		Handler(l.oidcCallbackHandler())
}

func (l *loginHandler) decodeInitialRequest(_ context.Context, r *http.Request) (interface{}, error) {
	return NewInitialRequest(r), nil
}

func (l *loginHandler) encodeInitialResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	loginResponse := response.(*LoginResponse)

	encodedNonceCookie, err := l.getEncodedNonceCookie(
		loginResponse.nonce,
		loginResponse.cookieSecureMode,
		nonceCookieMaxAge,
		loginResponse.secureCookie)
	if err != nil {
		return err
	}

	http.SetCookie(w, encodedNonceCookie)
	http.Redirect(w, loginResponse.Request, loginResponse.authURL, http.StatusSeeOther)
	return nil
}

// swagger:route GET /api/v2/dashboard/login
//
//	Redirects to the OIDC page for additional user authentication.
//
//	Parameters:
//		+ name: projectID
//		  in: query
//		  required: true
//		  type: string
//		+ name: clusterID
//		  in: query
//		  required: true
//		  type: string
//
//	Responses:
//		default: empty
func (l *loginHandler) redirectHandler() http.Handler {
	return httptransport.NewServer(
		l.chain(l.redirect),
		l.decodeInitialRequest,
		l.encodeInitialResponse,
		l.options...,
	)
}

func (l *loginHandler) redirect(ctx context.Context, request interface{}) (response interface{}, err error) {
	loginRequest := request.(*InitialRequest)
	nonce := rand.String(rand.IntnRange(10, 15))
	scopes := []string{"openid", "email"}

	// Make sure the global settings have the Dashboard integration enabled.
	if err := isEnabled(ctx, l.settingsProvider); err != nil {
		return nil, err
	}

	oidcIssuerVerifier := ctx.Value(middleware.OIDCIssuerVerifierContextKey).(authtypes.OIDCIssuerVerifier)

	if oidcIssuerVerifier.OIDCConfig().OfflineAccessAsScope {
		scopes = append(scopes, "offline_access")
	}

	state, err := l.encodeOIDCState(nonce, loginRequest.ProjectID, loginRequest.ClusterID)
	if err != nil {
		return nil, err
	}

	// get the redirect uri
	redirectURI, err := oidcIssuerVerifier.GetRedirectURI(loginRequest.Request.URL.Path)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Request:          loginRequest.Request,
		authURL:          oidcIssuerVerifier.AuthCodeURL(state, oidcIssuerVerifier.OIDCConfig().OfflineAccessAsScope, redirectURI, scopes...),
		nonce:            nonce,
		cookieSecureMode: oidcIssuerVerifier.OIDCConfig().CookieSecureMode,
		secureCookie:     oidcIssuerVerifier.OIDCConfig().SecureCookie,
	}, nil
}

func (l *loginHandler) getEncodedNonceCookie(nonce string, secureMode bool, maxAge int, secCookie *securecookie.SecureCookie) (*http.Cookie, error) {
	encoded, err := secCookie.Encode(nonceCookieName, nonce)
	if err != nil {
		return nil, fmt.Errorf("the encode cookie failed: %w", err)
	}

	return &http.Cookie{
		Name:     nonceCookieName,
		Value:    encoded,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secureMode,
		SameSite: http.SameSiteLaxMode,
	}, nil
}

func (l *loginHandler) decodeOIDCCallbackRequest(_ context.Context, r *http.Request) (interface{}, error) {
	return NewOIDCCallbackRequest(r)
}

func (l *loginHandler) encodeOIDCCallbackResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	callbackResponse := response.(*OIDCCallbackResponse)

	cookie, err := l.getEncodedNonceCookie("", callbackResponse.cookieSecureMode, -1, callbackResponse.secureCookie)
	if err != nil {
		return err
	}

	http.SetCookie(w, cookie)
	http.Redirect(w, callbackResponse.Request, l.getProxyURI(callbackResponse.projectID, callbackResponse.clusterID, callbackResponse.token), http.StatusSeeOther)
	return nil
}

// swagger:route GET /api/v2/dashboard/login
//
//	OIDC redirectURI endpoint that gets called after successful user authentication. Checks the token and redirects
//	user to the dashboard proxy endpoint: proxyHandler.storeTokenHandler
//
//	Parameters:
//		+ name: state
//		  in: query
//		  required: true
//		  type: string
//		+ name: code
//		  in: query
//		  required: true
//		  type: string
//
//	Responses:
//		default: empty
func (l *loginHandler) oidcCallbackHandler() http.Handler {
	return httptransport.NewServer(
		l.chain(l.oidcCallback),
		l.decodeOIDCCallbackRequest,
		l.encodeOIDCCallbackResponse,
		l.options...,
	)
}

func (l *loginHandler) oidcCallback(ctx context.Context, request interface{}) (response interface{}, err error) {
	oidcCallbackRequest := request.(*OIDCCallbackRequest)

	state := oidcCallbackRequest.State
	if err != nil {
		return nil, err
	}

	oidcIssuerVerifier := ctx.Value(middleware.OIDCIssuerVerifierContextKey).(authtypes.OIDCIssuerVerifier)

	nonce, err := l.getDecodedNonce(oidcCallbackRequest.Request, oidcIssuerVerifier.OIDCConfig().SecureCookie)
	if err != nil {
		return nil, err
	}

	if state.Nonce != nonce {
		return nil, utilerrors.NewBadRequest("incorrect value of state parameter: %s", state.Nonce)
	}

	// get the redirect uri
	redirectURI, err := oidcIssuerVerifier.GetRedirectURI(oidcCallbackRequest.Request.URL.Path)
	if err != nil {
		return nil, err
	}

	token, err := l.exchange(ctx, oidcCallbackRequest.Code, redirectURI)
	if err != nil {
		return nil, err
	}

	return &OIDCCallbackResponse{
		Request:          oidcCallbackRequest.Request,
		projectID:        state.ProjectID,
		clusterID:        state.ClusterID,
		token:            token,
		cookieSecureMode: oidcIssuerVerifier.OIDCConfig().CookieSecureMode,
		secureCookie:     oidcIssuerVerifier.OIDCConfig().SecureCookie,
	}, nil
}

func (l *loginHandler) exchange(ctx context.Context, code, overwriteRedirectURI string) (string, error) {
	oidcProvider := ctx.Value(middleware.OIDCIssuerVerifierContextKey).(authtypes.OIDCIssuerVerifier)

	oidcTokens, err := oidcProvider.Exchange(ctx, code, overwriteRedirectURI)

	if err != nil {
		return "", utilerrors.NewBadRequest("error while exchanging oidc code for token: %v", err)
	}

	if len(oidcTokens.RefreshToken) == 0 {
		return "", utilerrors.NewBadRequest("the refresh token is missing but required, try setting/unsetting \"oidc-offline-access-as-scope\" command line flag")
	}

	// claims, err := this.oidcIssuerVerifier.Verify(ctx, oidcTokens.IDToken)
	claims, err := oidcProvider.Verify(ctx, oidcTokens.IDToken)
	if err != nil {
		return "", utilerrors.New(http.StatusUnauthorized, err.Error())
	}

	if len(claims.Email) == 0 {
		return "", utilerrors.NewBadRequest("the token doesn't contain the mandatory \"email\" claim")
	}

	return oidcTokens.IDToken, nil
}

func (l *loginHandler) getDecodedNonce(r *http.Request, secCookie *securecookie.SecureCookie) (nonce string, err error) {
	cookie, err := r.Cookie(nonceCookieName)
	if err != nil {
		return
	}

	err = secCookie.Decode(nonceCookieName, cookie.Value, &nonce)
	return
}

func (l *loginHandler) getProxyURI(projectID string, clusterID string, token string) string {
	return fmt.Sprintf("/api/v2/projects/%s/clusters/%s/dashboard/proxy?token=%s", projectID, clusterID, token)
}

func (l *loginHandler) encodeOIDCState(nonce string, projectID string, clusterID string) (string, error) {
	oidcState := commonv2.OIDCState{
		Nonce:     nonce,
		ClusterID: clusterID,
		ProjectID: projectID,
	}

	rawState, err := json.Marshal(oidcState)
	if err != nil {
		return "", err
	}

	encodedState := base64.StdEncoding.EncodeToString(rawState)
	urlSafeState := url.QueryEscape(encodedState)

	return urlSafeState, nil
}

func decodeOIDCState(state string) (*commonv2.OIDCState, error) {
	unescapedState, err := url.QueryUnescape(state)
	if err != nil {
		return nil, utilerrors.NewBadRequest("incorrect value of state parameter, expected url encoded value: %v", err)
	}
	rawState, err := base64.StdEncoding.DecodeString(unescapedState)
	if err != nil {
		return nil, utilerrors.NewBadRequest("incorrect value of state parameter, expected base64 encoded value: %v", err)
	}
	oidcState := commonv2.OIDCState{}
	if err = json.Unmarshal(rawState, &oidcState); err != nil {
		return nil, utilerrors.NewBadRequest("incorrect value of state parameter, expected json encoded value: %v", err)
	}

	return &oidcState, nil
}

func NewLoginHandler(settingsProvider provider.SettingsProvider) Handler {
	return &loginHandler{
		settingsProvider: settingsProvider,
	}
}
