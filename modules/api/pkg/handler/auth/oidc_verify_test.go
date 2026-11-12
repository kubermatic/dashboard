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
	"testing"
	"time"

	"github.com/go-jose/go-jose/v4"
	"github.com/go-jose/go-jose/v4/jwt"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

const (
	loginClientID  = "kubermatic"
	issuerClientID = "kubermaticIssuer"
)

// signingIssuer is an OIDC provider that serves discovery and its signing keys, and signs ID tokens.
type signingIssuer struct {
	*httptest.Server

	key    *rsa.PrivateKey
	signer jose.Signer
}

func newSigningIssuer(t *testing.T) *signingIssuer {
	t.Helper()

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)

	signer, err := jose.NewSigner(
		jose.SigningKey{Algorithm: jose.RS256, Key: key},
		(&jose.SignerOptions{}).WithType("JWT").WithHeader("kid", "test-key"),
	)
	require.NoError(t, err)

	issuer := &signingIssuer{key: key, signer: signer}
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{
			"issuer":                 issuer.URL,
			"authorization_endpoint": issuer.URL + "/auth",
			"token_endpoint":         issuer.URL + "/token",
			"jwks_uri":               issuer.URL + "/keys",
		})
	})
	mux.HandleFunc("/keys", func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(jose.JSONWebKeySet{Keys: []jose.JSONWebKey{{
			Key:       &key.PublicKey,
			KeyID:     "test-key",
			Algorithm: string(jose.RS256),
			Use:       "sig",
		}}})
	})
	issuer.Server = httptest.NewServer(mux)
	t.Cleanup(issuer.Close)

	return issuer
}

// idToken signs an ID token with the given audience.
func (i *signingIssuer) idToken(t *testing.T, audience []string) string {
	t.Helper()

	claims := map[string]interface{}{
		"iss":   i.URL,
		"sub":   "user-1",
		"aud":   audience,
		"email": "bob@acme.com",
		"exp":   jwt.NewNumericDate(time.Now().Add(time.Hour)),
		"iat":   jwt.NewNumericDate(time.Now()),
	}

	token, err := jwt.Signed(i.signer).Claims(claims).Serialize()
	require.NoError(t, err)

	return token
}

func TestVerifyRequiresExactAudience(t *testing.T) {
	t.Parallel()

	issuer := newSigningIssuer(t)

	authenticator, err := auth.NewOpenIDClient(&authtypes.OIDCConfiguration{
		URL:            issuer.URL,
		ClientID:       loginClientID,
		StrictAudience: true,
	}, "", nil, nil)
	require.NoError(t, err)

	testcases := []struct {
		name     string
		audience []string
		wantErr  bool
	}{
		{
			name:     "the login client is the only audience",
			audience: []string{loginClientID},
		},
		{
			name:     "the issuer client is the only audience",
			audience: []string{issuerClientID},
			wantErr:  true,
		},
		{
			name:     "the login client and the issuer client are audiences",
			audience: []string{loginClientID, issuerClientID},
			wantErr:  true,
		},
		{
			name:     "the issuer client comes before the login client in the audiences",
			audience: []string{issuerClientID, loginClientID},
			wantErr:  true,
		},
		{
			name:     "no audience",
			audience: []string{},
			wantErr:  true,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			claims, err := authenticator.Verify(context.Background(), issuer.idToken(t, tc.audience))
			if tc.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, "bob@acme.com", claims.Email)
			assert.Equal(t, "user-1", claims.Subject)
		})
	}
}

// TestVerifyIssuerClientIsNotAcceptedByLoginClient checks that the two clients reject each other's tokens.
func TestVerifyIssuerClientIsNotAcceptedByLoginClient(t *testing.T) {
	t.Parallel()

	issuer := newSigningIssuer(t)

	newClient := func(clientID string) authtypes.OIDCIssuerVerifier {
		client, err := auth.NewOpenIDClient(&authtypes.OIDCConfiguration{URL: issuer.URL, ClientID: clientID}, "", nil, nil)
		require.NoError(t, err)
		return client
	}
	login := newClient(loginClientID)
	issuing := newClient(issuerClientID)

	loginToken := issuer.idToken(t, []string{loginClientID})
	issuerToken := issuer.idToken(t, []string{issuerClientID})

	_, err := login.Verify(context.Background(), loginToken)
	assert.NoError(t, err, "the login client must accept its own token")
	_, err = issuing.Verify(context.Background(), issuerToken)
	assert.NoError(t, err, "the issuer client must accept its own token")

	_, err = login.Verify(context.Background(), issuerToken)
	assert.Error(t, err, "the login client (KKP API) must reject the User Cluster token")
	_, err = issuing.Verify(context.Background(), loginToken)
	assert.Error(t, err, "the issuer client must reject the login token")
}

// TestVerifyAdditionalAudiencesAreOptIn checks that only clients with StrictAudience reject additional audiences.
func TestVerifyAdditionalAudiencesAreOptIn(t *testing.T) {
	t.Parallel()

	issuer := newSigningIssuer(t)
	token := issuer.idToken(t, []string{issuerClientID, loginClientID})

	newClient := func(strict bool) authtypes.OIDCIssuerVerifier {
		client, err := auth.NewOpenIDClient(&authtypes.OIDCConfiguration{URL: issuer.URL, ClientID: issuerClientID, StrictAudience: strict}, "", nil, nil)
		require.NoError(t, err)
		return client
	}

	_, err := newClient(false).Verify(context.Background(), token)
	assert.NoError(t, err, "a client without StrictAudience accepts additional audiences")
	_, err = newClient(true).Verify(context.Background(), token)
	assert.Error(t, err, "a client with StrictAudience rejects additional audiences")
}
