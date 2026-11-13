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

package authflow

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"

	handlerauth "k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

const (
	testLoginClientID     = "kubermatic"
	testLoginClientSecret = "login-secret"
)

// credentialsRecordingProvider is an OIDC provider that records the client credentials sent to its token endpoint.
type credentialsRecordingProvider struct {
	*httptest.Server

	lock     sync.Mutex
	clientID string
	secret   string
}

func newCredentialsRecordingProvider(t *testing.T) *credentialsRecordingProvider {
	t.Helper()

	p := &credentialsRecordingProvider{}
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{
			"issuer":                 p.URL,
			"authorization_endpoint": p.URL + "/auth",
			"token_endpoint":         p.URL + "/token",
			"jwks_uri":               p.URL + "/keys",
		})
	})
	mux.HandleFunc("/token", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// sent as basic auth or in the form
		id, secret, ok := r.BasicAuth()
		if !ok {
			id, secret = r.PostForm.Get("client_id"), r.PostForm.Get("client_secret")
		}
		p.lock.Lock()
		p.clientID, p.secret = id, secret
		p.lock.Unlock()

		w.Header().Set("Content-Type", "application/json")
		// not a JWT on purpose: only the credentials matter here
		_ = json.NewEncoder(w).Encode(map[string]string{
			"access_token": "access-token",
			"token_type":   "Bearer",
			"id_token":     "not-a-jwt",
		})
	})
	p.Server = httptest.NewServer(mux)
	t.Cleanup(p.Close)

	return p
}

func (p *credentialsRecordingProvider) receivedCredentials() (clientID, secret string) {
	p.lock.Lock()
	defer p.lock.Unlock()
	return p.clientID, p.secret
}

// TestLoginUsesTheClientItIsGiven checks that the login runs on the client it is given, with its ID and secret.
func TestLoginUsesTheClientItIsGiven(t *testing.T) {
	provider := newCredentialsRecordingProvider(t)
	sc := newTestSecureCookie()

	loginClient, err := handlerauth.NewOpenIDClient(&authtypes.OIDCConfiguration{
		URL:          provider.URL,
		ClientID:     testLoginClientID,
		ClientSecret: testLoginClientSecret,
		SecureCookie: sc,
	}, "https://kkp.example.com", nil, nil)
	if err != nil {
		t.Fatalf("failed to create the OIDC client: %v", err)
	}
	h := NewAuthHandler(loginClient, &fakeUserProvider{}, nil)

	t.Run("login redirects to the provider with the login client ID", func(t *testing.T) {
		rec := httptest.NewRecorder()
		h.loginHandler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, testLoginURL, nil))

		if rec.Code != http.StatusSeeOther {
			t.Fatalf("expected status %d, got %d (body: %q)", http.StatusSeeOther, rec.Code, rec.Body.String())
		}
		location, err := url.Parse(rec.Header().Get("Location"))
		if err != nil {
			t.Fatalf("failed to parse the redirect location: %v", err)
		}
		if got := location.Query().Get("client_id"); got != testLoginClientID {
			t.Errorf("expected client_id %q in the authorization request, got %q", testLoginClientID, got)
		}
	})

	t.Run("callback exchanges the code with the login client ID and secret", func(t *testing.T) {
		cookie := encodeStateCookie(t, sc, handlerauth.OAuthState{
			State:        "state-123",
			Nonce:        "nonce-abc",
			CodeVerifier: "verifier-xyz",
			RedirectURI:  "https://kkp.example.com/api/v2/auth/callback",
		})
		_ = runCallback(h, cookie, "state=state-123&code=fakeCode")

		clientID, secret := provider.receivedCredentials()
		if clientID != testLoginClientID {
			t.Errorf("expected the token endpoint to receive client ID %q, got %q", testLoginClientID, clientID)
		}
		if secret != testLoginClientSecret {
			t.Errorf("expected the token endpoint to receive the login client secret, got %q", secret)
		}
	})
}
