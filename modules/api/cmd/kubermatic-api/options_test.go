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

package main

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/util/sets"
)

func TestSingleOIDCClient(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name          string
		authenticator string
		issuer        string
		expected      bool
	}{
		{name: "same client ID", authenticator: "kubermaticIssuer", issuer: "kubermaticIssuer", expected: true},
		{name: "separate client IDs", authenticator: "kubermatic", issuer: "kubermaticIssuer"},
		{name: "no client IDs", authenticator: "", issuer: ""},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			o := serverRunOptions{oidcAuthenticatorClientID: tc.authenticator, oidcIssuerClientID: tc.issuer}
			assert.Equal(t, tc.expected, o.singleOIDCClient())
		})
	}
}

func TestAuthenticatorClientSecret(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                string
		authenticatorID     string
		authenticatorSecret string
		issuerID            string
		issuerSecret        string
		expected            string
	}{
		{
			name:                "separate clients use the authenticator secret",
			authenticatorID:     "kubermatic",
			authenticatorSecret: "login-secret",
			issuerID:            "kubermaticIssuer",
			issuerSecret:        "issuer-secret",
			expected:            "login-secret",
		},
		{
			name:            "single client reuses the issuer secret",
			authenticatorID: "kubermaticIssuer",
			issuerID:        "kubermaticIssuer",
			issuerSecret:    "issuer-secret",
			expected:        "issuer-secret",
		},
		{
			name:                "single client prefers an explicit authenticator secret",
			authenticatorID:     "kubermaticIssuer",
			authenticatorSecret: "explicit-secret",
			issuerID:            "kubermaticIssuer",
			issuerSecret:        "issuer-secret",
			expected:            "explicit-secret",
		},
		{
			name:            "separate clients without an authenticator secret do not use the issuer secret",
			authenticatorID: "kubermatic",
			issuerID:        "kubermaticIssuer",
			issuerSecret:    "issuer-secret",
			expected:        "",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			o := serverRunOptions{
				oidcAuthenticatorClientID:     tc.authenticatorID,
				oidcAuthenticatorClientSecret: tc.authenticatorSecret,
				oidcIssuerClientID:            tc.issuerID,
				oidcIssuerClientSecret:        tc.issuerSecret,
			}
			assert.Equal(t, tc.expected, o.authenticatorClientSecret())
		})
	}
}

func TestValidateOIDC(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name            string
		authenticatorID string
		secret          string
		issuerID        string
		expectedErr     string
	}{
		{name: "separate clients with a secret", authenticatorID: "kubermatic", secret: "login-secret", issuerID: "kubermaticIssuer"},
		{name: "single client without a secret", authenticatorID: "kubermaticIssuer", issuerID: "kubermaticIssuer"},
		{
			name:            "separate clients without a secret",
			authenticatorID: "kubermatic",
			issuerID:        "kubermaticIssuer",
			expectedErr:     "-oidc-authenticator-client-secret is required",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			o := serverRunOptions{
				oidcAuthenticatorClientID:     tc.authenticatorID,
				oidcAuthenticatorClientSecret: tc.secret,
				oidcIssuerClientID:            tc.issuerID,
			}

			err := o.validateOIDC()
			if tc.expectedErr == "" {
				assert.NoError(t, err)
				return
			}
			assert.ErrorContains(t, err, tc.expectedErr)
		})
	}
}

func TestUserClusterClientIDs(t *testing.T) {
	t.Parallel()

	seeds := map[string]*kubermaticv1.Seed{
		"europe": {Spec: kubermaticv1.SeedSpec{OIDCProviderConfiguration: &kubermaticv1.OIDCProviderConfiguration{IssuerClientID: "europeIssuer"}}},
		"asia":   {Spec: kubermaticv1.SeedSpec{OIDCProviderConfiguration: &kubermaticv1.OIDCProviderConfiguration{}}},
		"us":     {},
	}
	seedsGetter := func() (map[string]*kubermaticv1.Seed, error) { return seeds, nil }

	t.Run("single OIDC client", func(t *testing.T) {
		t.Parallel()

		o := serverRunOptions{oidcAuthenticatorClientID: "kubermaticIssuer", oidcIssuerClientID: "kubermaticIssuer"}
		assert.Nil(t, o.userClusterClientIDs(seedsGetter, zap.NewNop().Sugar()))
	})

	t.Run("separate OIDC clients", func(t *testing.T) {
		t.Parallel()

		o := serverRunOptions{oidcAuthenticatorClientID: "kubermatic", oidcIssuerClientID: "kubermaticIssuer"}
		denied := o.userClusterClientIDs(seedsGetter, zap.NewNop().Sugar())
		require.NotNil(t, denied)

		ids, err := denied(context.Background())
		require.NoError(t, err)
		assert.Equal(t, sets.New("kubermaticIssuer", "europeIssuer"), ids)
	})

	t.Run("listing the Seeds fails", func(t *testing.T) {
		t.Parallel()

		o := serverRunOptions{oidcAuthenticatorClientID: "kubermatic", oidcIssuerClientID: "kubermaticIssuer"}
		denied := o.userClusterClientIDs(func() (map[string]*kubermaticv1.Seed, error) {
			return nil, errors.New("cache not synced")
		}, zap.NewNop().Sugar())
		require.NotNil(t, denied)

		_, err := denied(context.Background())
		assert.ErrorContains(t, err, "cache not synced")
	})

	t.Run("a Seed uses the login client", func(t *testing.T) {
		t.Parallel()

		seeds := map[string]*kubermaticv1.Seed{
			"europe": {Spec: kubermaticv1.SeedSpec{OIDCProviderConfiguration: &kubermaticv1.OIDCProviderConfiguration{IssuerClientID: "kubermatic"}}},
			"asia":   {Spec: kubermaticv1.SeedSpec{OIDCProviderConfiguration: &kubermaticv1.OIDCProviderConfiguration{IssuerClientID: "asiaIssuer"}}},
		}
		core, logs := observer.New(zap.WarnLevel)
		o := serverRunOptions{oidcAuthenticatorClientID: "kubermatic", oidcIssuerClientID: "kubermaticIssuer"}
		denied := o.userClusterClientIDs(func() (map[string]*kubermaticv1.Seed, error) { return seeds, nil }, zap.New(core).Sugar())

		for range 3 {
			ids, err := denied(context.Background())
			require.NoError(t, err)
			assert.Equal(t, sets.New("kubermaticIssuer", "asiaIssuer"), ids)
		}

		entries := logs.All()
		require.Len(t, entries, 1, "the warning must be logged once per Seed")
		assert.Equal(t, "europe", entries[0].ContextMap()["seed"])
	})
}

func TestValidateAdditionalRedirectURIs(t *testing.T) {
	testCases := []struct {
		name        string
		uris        []string
		expectedErr string
	}{
		{
			name: "no entries",
		},
		{
			name: "canonical origins",
			uris: []string{"https://kkp-proxy.example.com", "https://kkp-internal.example.com:8443/"},
		},
		{
			name:        "entry with a path",
			uris:        []string{"https://kkp-proxy.example.com/api/v2/auth/callback"},
			expectedErr: `invalid -oidc-issuer-additional-redirect-uris entry "https://kkp-proxy.example.com/api/v2/auth/callback": must not contain a path, only scheme, host and optional port`,
		},
		{
			name:        "entry with an explicit default port",
			uris:        []string{"https://kkp-proxy.example.com", "https://kkp-port.example.com:443"},
			expectedErr: `invalid -oidc-issuer-additional-redirect-uris entry "https://kkp-port.example.com:443": must be written in canonical form as "https://kkp-port.example.com" (lower case, without the default port)`,
		},
		{
			name:        "entry with user info",
			uris:        []string{"https://user@kkp-proxy.example.com"},
			expectedErr: `invalid -oidc-issuer-additional-redirect-uris entry "https://user@kkp-proxy.example.com": must not contain user info`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			o := serverRunOptions{
				serviceAccountSigningKey:         strings.Repeat("k", 32),
				oidcIssuerAdditionalRedirectURIs: tc.uris,
			}
			err := o.validate()
			if tc.expectedErr == "" {
				if err != nil {
					t.Fatalf("expected no error, got %v", err)
				}
				return
			}
			if err == nil || err.Error() != tc.expectedErr {
				t.Fatalf("expected error %q, got %v", tc.expectedErr, err)
			}
		})
	}
}
