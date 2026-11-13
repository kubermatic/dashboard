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
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/securecookie"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	providerauth "k8c.io/dashboard/v2/pkg/provider/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources/certificates"

	"k8s.io/apimachinery/pkg/api/equality"
)

// newDiscoveryServer serves the OIDC discovery document that NewOpenIDClient fetches.
func newDiscoveryServer(t *testing.T) *httptest.Server {
	t.Helper()
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/.well-known/openid-configuration" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"issuer":                 server.URL,
			"authorization_endpoint": server.URL + "/auth",
			"token_endpoint":         server.URL + "/token",
			"jwks_uri":               server.URL + "/keys",
		})
	}))
	t.Cleanup(server.Close)
	return server
}

func TestOIDCIssuerVerifierProviderFactoryCopiesAdditionalRedirectURIs(t *testing.T) {
	server := newDiscoveryServer(t)
	additionalRedirectURIs := []string{"https://kkp-proxy.example.com", "https://kkp-internal.example.com:8443"}

	defaultVerifier, err := auth.NewOpenIDClient(&authtypes.OIDCConfiguration{
		URL:                    server.URL,
		ClientID:               "kubermatic",
		SecureCookie:           securecookie.New([]byte("default-hash-key"), nil),
		AdditionalRedirectURIs: additionalRedirectURIs,
	}, "https://kkp.example.com/api/v1/kubeconfig", nil, nil)
	if err != nil {
		t.Fatalf("failed to create the default verifier: %v", err)
	}

	getter := providerauth.OIDCIssuerVerifierProviderFactory(defaultVerifier, "https://kkp.example.com/api/v1/kubeconfig", certificates.NewFakeCABundle())

	seed := &kubermaticv1.Seed{
		Spec: kubermaticv1.SeedSpec{
			OIDCProviderConfiguration: &kubermaticv1.OIDCProviderConfiguration{
				IssuerURL:          server.URL,
				IssuerClientID:     "seed-client",
				IssuerClientSecret: "seed-secret",
			},
		},
	}
	seedVerifier, err := getter(seed)
	if err != nil {
		t.Fatalf("failed to create the Seed verifier: %v", err)
	}
	if seedVerifier == defaultVerifier {
		t.Fatal("expected a separate verifier for a Seed with its own OIDC provider")
	}

	if got := seedVerifier.OIDCConfig().AdditionalRedirectURIs; !equality.Semantic.DeepEqual(got, additionalRedirectURIs) {
		t.Errorf("expected additional redirect URIs %v, got %v", additionalRedirectURIs, got)
	}
	if got := seedVerifier.OIDCConfig().ClientID; got != "seed-client" {
		t.Errorf("expected the Seed client ID, got %q", got)
	}
}
