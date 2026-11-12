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
	"testing"

	"github.com/stretchr/testify/assert"
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
