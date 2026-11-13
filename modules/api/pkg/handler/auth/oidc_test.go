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
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"
	"time"

	"github.com/go-jose/go-jose/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

const (
	testClientID     = "kubermaticIssuer"
	testSigningKeyID = "test"
)

// fakeIssuer is a minimal OIDC provider serving discovery, its signing key and a token
// endpoint that records the code_verifier it receives.
type fakeIssuer struct {
	*httptest.Server

	lock         sync.Mutex
	codeVerifier string
	signingKey   *rsa.PrivateKey
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
	mux.HandleFunc("/keys", func(w http.ResponseWriter, _ *http.Request) {
		keys := jose.JSONWebKeySet{}
		if key := issuer.getSigningKey(); key != nil {
			keys.Keys = append(keys.Keys, jose.JSONWebKey{Key: &key.PublicKey, KeyID: testSigningKeyID, Algorithm: string(jose.RS256), Use: "sig"})
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(keys)
	})
	issuer.Server = httptest.NewServer(mux)
	t.Cleanup(issuer.Close)
	return issuer
}

func (f *fakeIssuer) getSigningKey() *rsa.PrivateKey {
	f.lock.Lock()
	defer f.lock.Unlock()
	return f.signingKey
}

// signIDToken returns an ID token of the issuer for the test client with the given extra claims.
func (f *fakeIssuer) signIDToken(t *testing.T, extraClaims map[string]interface{}) string {
	t.Helper()

	f.lock.Lock()
	if f.signingKey == nil {
		key, err := rsa.GenerateKey(rand.Reader, 2048)
		require.NoError(t, err)
		f.signingKey = key
	}
	key := f.signingKey
	f.lock.Unlock()

	claims := map[string]interface{}{
		"iss":   f.URL,
		"aud":   testClientID,
		"sub":   "bob",
		"email": "bob@acme.com",
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(time.Hour).Unix(),
	}
	for name, value := range extraClaims {
		claims[name] = value
	}
	payload, err := json.Marshal(claims)
	require.NoError(t, err)

	signer, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.RS256, Key: jose.JSONWebKey{Key: key, KeyID: testSigningKeyID}}, nil)
	require.NoError(t, err)
	signed, err := signer.Sign(payload)
	require.NoError(t, err)
	token, err := signed.CompactSerialize()
	require.NoError(t, err)

	return token
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
		ClientID:     testClientID,
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

// TestVerifyEmailVerifiedClaim checks that only a token without the email_verified claim, or with
// the claim set to true, counts as a login with a verified email. kube-apiserver rejects every
// other token when the username is the email.
func TestVerifyEmailVerifiedClaim(t *testing.T) {
	t.Parallel()
	yes, no := true, false
	testcases := []struct {
		Name     string
		Claims   map[string]interface{}
		Expected *bool
	}{
		{Name: "token without the claim"},
		{Name: "true", Claims: map[string]interface{}{"email_verified": true}, Expected: &yes},
		{Name: "false", Claims: map[string]interface{}{"email_verified": false}, Expected: &no},
		{Name: "a string", Claims: map[string]interface{}{"email_verified": "true"}, Expected: &no},
		{Name: "a number", Claims: map[string]interface{}{"email_verified": 1}, Expected: &no},
		{Name: "null", Claims: map[string]interface{}{"email_verified": nil}, Expected: &no},
	}

	issuer := newFakeIssuer(t)
	client := newTestOpenIDClient(t, issuer)

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			claims, err := client.Verify(context.Background(), issuer.signIDToken(t, tc.Claims))
			require.NoError(t, err)

			assert.Equal(t, "bob@acme.com", claims.Email)
			assert.Equal(t, tc.Expected, claims.EmailVerified)
		})
	}
}
