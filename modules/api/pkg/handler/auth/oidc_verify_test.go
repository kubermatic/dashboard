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
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/go-jose/go-jose/v4"
	"github.com/go-jose/go-jose/v4/jwt"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"

	"k8s.io/apimachinery/pkg/util/sets"
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

// newClient creates an OIDC client for clientID against the issuer.
func (i *signingIssuer) newClient(t *testing.T, clientID string, opts ...auth.OpenIDClientOption) authtypes.OIDCIssuerVerifier {
	t.Helper()

	client, err := auth.NewOpenIDClient(&authtypes.OIDCConfiguration{URL: i.URL, ClientID: clientID}, "", nil, nil, opts...)
	require.NoError(t, err)

	return client
}

func deniedAudience(ids ...string) auth.DeniedAudienceFunc {
	return func(context.Context) (sets.Set[string], error) {
		return sets.New(ids...), nil
	}
}

func TestVerifyDeniedAudience(t *testing.T) {
	t.Parallel()

	const seedIssuerClientID = "seedIssuer"

	issuer := newSigningIssuer(t)
	login := issuer.newClient(t, loginClientID, auth.WithDeniedAudience(deniedAudience(issuerClientID, seedIssuerClientID)))

	testcases := []struct {
		name     string
		audience []string
		wantErr  string
	}{
		{
			name:     "the login client is the only audience",
			audience: []string{loginClientID},
		},
		{
			name:     "an unrelated audience next to the login client",
			audience: []string{loginClientID, "another"},
		},
		{
			name:     "the issuer client next to the login client",
			audience: []string{loginClientID, issuerClientID},
			wantErr:  `the token lists the User Cluster OIDC client "kubermaticIssuer" in its audience`,
		},
		{
			name:     "the issuer client before the login client",
			audience: []string{issuerClientID, loginClientID},
			wantErr:  `the token lists the User Cluster OIDC client "kubermaticIssuer" in its audience`,
		},
		{
			name:     "a Seed issuer client next to the login client",
			audience: []string{loginClientID, "another", seedIssuerClientID},
			wantErr:  `the token lists the User Cluster OIDC client "seedIssuer" in its audience`,
		},
		{
			name:     "the issuer client is the only audience",
			audience: []string{issuerClientID},
			wantErr:  "expected audience",
		},
		{
			name:     "no audience",
			audience: []string{},
			wantErr:  "expected audience",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			claims, err := login.Verify(context.Background(), issuer.idToken(t, tc.audience))
			if tc.wantErr != "" {
				assert.ErrorContains(t, err, tc.wantErr)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, "bob@acme.com", claims.Email)
			assert.Equal(t, "user-1", claims.Subject)
		})
	}
}

// TestVerifyDeniedAudienceFailsClosed checks that tokens are rejected while the denied audiences are unknown,
// and accepted again once they can be read.
func TestVerifyDeniedAudienceFailsClosed(t *testing.T) {
	t.Parallel()

	issuer := newSigningIssuer(t)

	var failing atomic.Bool
	failing.Store(true)
	login := issuer.newClient(t, loginClientID, auth.WithDeniedAudience(func(context.Context) (sets.Set[string], error) {
		if failing.Load() {
			return nil, errors.New("seeds are not available")
		}
		return sets.New(issuerClientID), nil
	}))
	token := issuer.idToken(t, []string{loginClientID, "another"})

	_, err := login.Verify(context.Background(), token)
	assert.ErrorContains(t, err, "seeds are not available")

	failing.Store(false)
	_, err = login.Verify(context.Background(), token)
	assert.NoError(t, err, "the error must not be cached")
}

// TestVerifyWithoutDeniedAudience covers the issuer clients and the single OIDC client setup, which accept any
// additional audience.
func TestVerifyWithoutDeniedAudience(t *testing.T) {
	t.Parallel()

	issuer := newSigningIssuer(t)
	client := issuer.newClient(t, issuerClientID)

	for _, audience := range [][]string{
		{issuerClientID},
		{issuerClientID, "another"},
		{loginClientID, issuerClientID},
	} {
		_, err := client.Verify(context.Background(), issuer.idToken(t, audience))
		assert.NoError(t, err, "audience %q", audience)
	}
}

// TestVerifyIssuerClientIsNotAcceptedByLoginClient checks that the two clients reject each other's tokens.
func TestVerifyIssuerClientIsNotAcceptedByLoginClient(t *testing.T) {
	t.Parallel()

	issuer := newSigningIssuer(t)
	login := issuer.newClient(t, loginClientID, auth.WithDeniedAudience(deniedAudience(issuerClientID)))
	issuing := issuer.newClient(t, issuerClientID)

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
