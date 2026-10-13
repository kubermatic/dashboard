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

package auth_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

// fakeIssuer is a minimal OIDC provider serving discovery and a token endpoint
// that records the code_verifier it receives.
type fakeIssuer struct {
	*httptest.Server

	lock         sync.Mutex
	codeVerifier string
}

func newFakeIssuer(t *testing.T) *fakeIssuer {
	t.Helper()
	issuer := &fakeIssuer{}
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{
			"issuer":                 issuer.URL,
			"authorization_endpoint": issuer.URL + "/auth",
			"token_endpoint":         issuer.URL + "/token",
			"jwks_uri":               issuer.URL + "/keys",
		})
	})
	mux.HandleFunc("/token", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		issuer.lock.Lock()
		issuer.codeVerifier = r.PostForm.Get("code_verifier")
		issuer.lock.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"access_token": "access-token",
			"token_type":   "Bearer",
			"id_token":     "id-token",
		})
	})
	issuer.Server = httptest.NewServer(mux)
	t.Cleanup(issuer.Close)
	return issuer
}

func (f *fakeIssuer) receivedCodeVerifier() string {
	f.lock.Lock()
	defer f.lock.Unlock()
	return f.codeVerifier
}

func newTestOpenIDClient(t *testing.T, issuer *fakeIssuer) authtypes.OIDCIssuerVerifier {
	t.Helper()
	client, err := auth.NewOpenIDClient(&authtypes.OIDCConfiguration{
		URL:          issuer.URL,
		ClientID:     "kubermaticIssuer",
		ClientSecret: "secret",
	}, "https://kkp.example.com/api/v1/kubeconfig", nil, nil)
	if err != nil {
		t.Fatalf("failed to create OpenID client: %v", err)
	}
	return client
}

func TestAuthCodeURL(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name                  string
		CodeVerifier          string
		Nonce                 string
		OfflineAsScope        bool
		ExpectedCodeChallenge string
		ExpectedMethod        string
		ExpectedAccessType    string
	}{
		{
			Name:                  "scenario 1, PKCE challenge and nonce are added",
			CodeVerifier:          "verifier-xyz",
			Nonce:                 "nonce-abc",
			OfflineAsScope:        true,
			ExpectedCodeChallenge: oauth2.S256ChallengeFromVerifier("verifier-xyz"),
			ExpectedMethod:        "S256",
			ExpectedAccessType:    "online",
		},
		{
			Name:               "scenario 2, no PKCE challenge and nonce without verifier and nonce",
			ExpectedAccessType: "offline",
		},
	}

	issuer := newFakeIssuer(t)
	client := newTestOpenIDClient(t, issuer)

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			authURL, err := url.Parse(client.AuthCodeURL("state-123", tc.OfflineAsScope, "", tc.CodeVerifier, tc.Nonce, "openid", "email"))
			if err != nil {
				t.Fatalf("failed to parse auth URL: %v", err)
			}
			q := authURL.Query()

			assert.Equal(t, "state-123", q.Get("state"))
			assert.Equal(t, tc.ExpectedCodeChallenge, q.Get("code_challenge"))
			assert.Equal(t, tc.ExpectedMethod, q.Get("code_challenge_method"))
			assert.Equal(t, tc.Nonce, q.Get("nonce"))
			assert.Equal(t, tc.ExpectedAccessType, q.Get("access_type"))
		})
	}
}

func TestExchangeSendsCodeVerifier(t *testing.T) {
	t.Parallel()
	issuer := newFakeIssuer(t)
	client := newTestOpenIDClient(t, issuer)

	token, err := client.Exchange(context.Background(), "code-123", "", "verifier-xyz")
	if err != nil {
		t.Fatalf("failed to exchange code: %v", err)
	}

	assert.Equal(t, "verifier-xyz", issuer.receivedCodeVerifier())
	assert.Equal(t, "id-token", token.IDToken)
}
