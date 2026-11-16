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

package kubernetesdashboard_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"

	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const nonceCookieName = "nonce"

func TestLogin(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name string
		// dropCookie simulates a callback without the cookie holding the nonce and PKCE verifier.
		dropCookie bool
		// tamperCookie simulates a callback with a cookie whose value was altered.
		tamperCookie bool
		// nonceClaim simulates an ID token issued for a different authentication request.
		nonceClaim string
		// foreignState simulates a callback carrying the state of a different authentication request.
		foreignState       bool
		ExpectedHTTPStatus int
		ExpectedLocation   string
		// ExpectedError is a part of the error message rendered for rejected callbacks.
		ExpectedError string
	}{
		{
			Name:               "scenario 1, callback exchanges the code with the PKCE verifier and redirects to the proxy",
			ExpectedHTTPStatus: http.StatusSeeOther,
			ExpectedLocation:   fmt.Sprintf("/api/v2/projects/%s/clusters/%s/dashboard/proxy?token=%s", test.GenDefaultProject().Name, test.ClusterID, test.IDToken),
		},
		{
			Name:               "scenario 2, callback without the nonce cookie is rejected",
			dropCookie:         true,
			ExpectedHTTPStatus: http.StatusBadRequest,
			ExpectedError:      "named cookie not present",
		},
		{
			Name:               "scenario 3, callback with a tampered nonce cookie is rejected",
			tamperCookie:       true,
			ExpectedHTTPStatus: http.StatusBadRequest,
			ExpectedError:      "cookie: securecookie:",
		},
		{
			Name:               "scenario 4, callback with an ID token for a different nonce is rejected",
			nonceClaim:         "nonce-of-another-login",
			ExpectedHTTPStatus: http.StatusBadRequest,
			ExpectedError:      "incorrect value of nonce claim in the ID token",
		},
		{
			Name:               "scenario 5, callback with the state of a different login is rejected",
			foreignState:       true,
			ExpectedHTTPStatus: http.StatusBadRequest,
			ExpectedError:      "incorrect value of state parameter",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			existingKubermaticObjects := []ctrlruntimeclient.Object{
				test.GenTestSeed(),
				test.GenDefaultProject(),
				test.GenDefaultUser(),
				test.GenDefaultOwnerBinding(),
				test.GenCluster(test.ClusterID, "AbcCluster", test.GenDefaultProject().Name, test.DefaultCreationTimestamp()),
				test.GenDefaultSettings(),
			}
			ep, clients, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, nil, nil, existingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			clients.FakeOIDCClient.SetNonceClaim(tc.nonceClaim)

			// initial phase: redirect to the OIDC provider
			reqURL := fmt.Sprintf("/api/v2/dashboard/login?projectID=%s&clusterID=%s", test.GenDefaultProject().Name, test.ClusterID)
			req := httptest.NewRequest(http.MethodGet, reqURL, nil)
			res := httptest.NewRecorder()
			ep.ServeHTTP(res, req)
			result := res.Result()
			defer result.Body.Close()

			if !assert.Equal(t, http.StatusSeeOther, res.Code, res.Body.String()) {
				return
			}
			location, err := result.Location()
			if err != nil {
				t.Fatalf("expected url for redirection %v", err)
			}
			assert.Equal(t, "S256", location.Query().Get("code_challenge_method"))
			assert.NotEmpty(t, location.Query().Get("code_challenge"))
			assert.NotEmpty(t, location.Query().Get("nonce"))

			state := location.Query().Get("state")
			if tc.foreignState {
				// start a second login and use its state with the cookie of the first one
				foreignRes := httptest.NewRecorder()
				ep.ServeHTTP(foreignRes, httptest.NewRequest(http.MethodGet, reqURL, nil))
				foreignResult := foreignRes.Result()
				defer foreignResult.Body.Close()
				foreignLocation, err := foreignResult.Location()
				if err != nil {
					t.Fatalf("expected url for redirection %v", err)
				}
				state = foreignLocation.Query().Get("state")
			}

			// exchange code phase: callback from the OIDC provider
			callbackURL := fmt.Sprintf("/api/v2/dashboard/login?state=%s&code=%s", url.QueryEscape(state), test.AuthorizationCode)
			req = httptest.NewRequest(http.MethodGet, callbackURL, nil)
			if !tc.dropCookie {
				for _, cookie := range result.Cookies() {
					if cookie.Name == nonceCookieName {
						if tc.tamperCookie {
							cookie.Value += "tampered"
						}
						req.AddCookie(cookie)
					}
				}
			}
			res = httptest.NewRecorder()
			ep.ServeHTTP(res, req)
			defer res.Result().Body.Close()

			assert.Equal(t, tc.ExpectedHTTPStatus, res.Code, res.Body.String())
			if tc.ExpectedLocation != "" {
				assert.Equal(t, tc.ExpectedLocation, res.Header().Get("Location"))
			}
			if tc.ExpectedError != "" {
				assert.Contains(t, res.Body.String(), tc.ExpectedError)
			}
		})
	}
}

func TestLoginRedirectURI(t *testing.T) {
	t.Parallel()
	const mainWithPort = "https://kkp.example.com:443/api/v1/kubeconfig"

	testcases := []struct {
		name                string
		redirectURI         string
		origin              string
		dropStoredRedirect  bool
		expectedRedirectURI string
	}{
		{
			name:                "no origin keeps the main hostname with explicit port",
			redirectURI:         mainWithPort,
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/dashboard/login",
		},
		{
			name:                "main hostname origin keeps the main hostname with explicit port",
			redirectURI:         mainWithPort,
			origin:              "https://kkp.example.com",
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/dashboard/login",
		},
		{
			name:                "main hostname origin with a configured custom path",
			redirectURI:         "https://kkp.example.com/custom/kubeconfig",
			origin:              "https://kkp.example.com",
			expectedRedirectURI: "https://kkp.example.com/api/v2/dashboard/login",
		},
		{
			name:                "additional origin redirects back to the proxy hostname",
			redirectURI:         mainWithPort,
			origin:              "https://kkp-proxy.example.com",
			expectedRedirectURI: "https://kkp-proxy.example.com/api/v2/dashboard/login",
		},
		{
			name:                "unlisted origin keeps the main hostname",
			redirectURI:         mainWithPort,
			origin:              "https://evil.example.com",
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/dashboard/login",
		},
		{
			name:                "cookie without a redirect URI from before the upgrade uses the main hostname",
			redirectURI:         mainWithPort,
			dropStoredRedirect:  true,
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/dashboard/login",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			existingKubermaticObjects := []ctrlruntimeclient.Object{
				test.GenTestSeed(),
				test.GenDefaultProject(),
				test.GenDefaultUser(),
				test.GenDefaultOwnerBinding(),
				test.GenCluster(test.ClusterID, "AbcCluster", test.GenDefaultProject().Name, test.DefaultCreationTimestamp()),
				test.GenDefaultSettings(),
			}
			ep, clients, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, nil, nil, existingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			clients.FakeOIDCClient.SetRedirectURI(tc.redirectURI)
			clients.FakeOIDCClient.SetAdditionalRedirectURIs("https://kkp-proxy.example.com")

			reqURL := fmt.Sprintf("/api/v2/dashboard/login?projectID=%s&clusterID=%s&origin=%s", test.GenDefaultProject().Name, test.ClusterID, url.QueryEscape(tc.origin))
			res := httptest.NewRecorder()
			ep.ServeHTTP(res, httptest.NewRequest(http.MethodGet, reqURL, nil))
			if res.Code != http.StatusSeeOther {
				t.Fatalf("expected status %d, got %d: %s", http.StatusSeeOther, res.Code, res.Body.String())
			}

			location, err := res.Result().Location()
			if err != nil {
				t.Fatalf("expected url for redirection: %v", err)
			}
			assert.Equal(t, tc.expectedRedirectURI, location.Query().Get("redirect_uri"))

			cookie := test.GetCookie(res.Result().Cookies(), nonceCookieName)
			if cookie == nil {
				t.Fatalf("cookie %q not set", nonceCookieName)
			}
			if tc.dropStoredRedirect {
				if cookie, err = test.WithoutStoredRedirectURI(cookie); err != nil {
					t.Fatalf("failed to re-sign the state cookie: %v", err)
				}
			}

			// the fake provider rejects a token request whose redirect_uri differs from the authorization request
			callbackURL := fmt.Sprintf("/api/v2/dashboard/login?state=%s&code=%s", url.QueryEscape(location.Query().Get("state")), test.AuthorizationCode)
			req := httptest.NewRequest(http.MethodGet, callbackURL, nil)
			req.AddCookie(cookie)
			res = httptest.NewRecorder()
			ep.ServeHTTP(res, req)
			assert.Equal(t, http.StatusSeeOther, res.Code, res.Body.String())
		})
	}
}
