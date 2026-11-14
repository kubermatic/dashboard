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

package common

import (
	"testing"

	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
)

func TestEffectiveGroupsPrefix(t *testing.T) {
	t.Parallel()

	authConfig := &kubermaticv1.AuthenticationConfiguration{SecretName: "auth", SecretKey: "config.yaml"}
	oidcEnabled := features.FeatureGate{features.OpenIDAuthPlugin: true}

	testcases := []struct {
		name           string
		cluster        kubermaticv1.ClusterSpec
		datacenter     *kubermaticv1.Datacenter
		seed           *kubermaticv1.Seed
		featureGates   features.FeatureGate
		expectedPrefix string
	}{
		{
			name:           "cluster authenticationConfiguration is opaque",
			cluster:        kubermaticv1.ClusterSpec{AuthenticationConfiguration: authConfig},
			featureGates:   oidcEnabled,
			expectedPrefix: "",
		},
		{
			name:           "datacenter authenticationConfiguration is opaque",
			datacenter:     &kubermaticv1.Datacenter{Spec: kubermaticv1.DatacenterSpec{AuthenticationConfiguration: authConfig}},
			featureGates:   oidcEnabled,
			expectedPrefix: "",
		},
		{
			name:           "seed authenticationConfiguration is opaque",
			seed:           &kubermaticv1.Seed{Spec: kubermaticv1.SeedSpec{AuthenticationConfiguration: authConfig}},
			featureGates:   oidcEnabled,
			expectedPrefix: "",
		},
		{
			name: "cluster OIDC settings use their own groups prefix",
			//nolint:staticcheck
			cluster: kubermaticv1.ClusterSpec{OIDC: kubermaticv1.OIDCSettings{
				IssuerURL:    "https://dex.example.com",
				ClientID:     "kubernetes",
				GroupsPrefix: "corp:",
			}},
			featureGates:   oidcEnabled,
			expectedPrefix: "corp:",
		},
		{
			name: "cluster OIDC settings without groups prefix",
			//nolint:staticcheck
			cluster: kubermaticv1.ClusterSpec{OIDC: kubermaticv1.OIDCSettings{
				IssuerURL: "https://dex.example.com",
				ClientID:  "kubernetes",
			}},
			featureGates:   oidcEnabled,
			expectedPrefix: "",
		},
		{
			name:           "OpenIDAuthPlugin uses the KKP default prefix",
			featureGates:   oidcEnabled,
			expectedPrefix: "oidc:",
		},
		{
			name:           "no OIDC authentication configured",
			expectedPrefix: "",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			cluster := &kubermaticv1.Cluster{Spec: tc.cluster}
			if prefix := effectiveGroupsPrefix(cluster, tc.datacenter, tc.seed, tc.featureGates); prefix != tc.expectedPrefix {
				t.Fatalf("expected prefix %q, got %q", tc.expectedPrefix, prefix)
			}
		})
	}
}

func TestAddGroupsPrefix(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		prefix   string
		group    string
		expected string
	}{
		{prefix: "oidc:", group: "kubermatic:sig-api-ui", expected: "oidc:kubermatic:sig-api-ui"},
		{prefix: "oidc:", group: "oidc:kubermatic:sig-api-ui", expected: "oidc:kubermatic:sig-api-ui"},
		{prefix: "", group: "kubermatic:sig-api-ui", expected: "kubermatic:sig-api-ui"},
	}

	for _, tc := range testcases {
		if result := addGroupsPrefix(tc.prefix, tc.group); result != tc.expected {
			t.Errorf("addGroupsPrefix(%q, %q): expected %q, got %q", tc.prefix, tc.group, tc.expected, result)
		}
	}
}

func TestGroupsPrefixFromAuthenticationConfiguration(t *testing.T) {
	t.Parallel()

	const issuerURL = "https://kkp.example.com/dex"

	testcases := []struct {
		name           string
		authConfig     string
		expectedPrefix string
		expectedError  bool
	}{
		{
			name: "authenticator matching the issuer",
			authConfig: `
apiVersion: apiserver.config.k8s.io/v1
kind: AuthenticationConfiguration
jwt:
- issuer:
    url: https://other.example.com
    audiences: [other]
  claimMappings:
    username: {claim: email, prefix: ""}
    groups: {claim: groups, prefix: "other:"}
- issuer:
    url: https://kkp.example.com/dex/
    audiences: [kubernetes]
  claimMappings:
    username: {claim: email, prefix: ""}
    groups: {claim: groups, prefix: "oidc:"}
`,
			expectedPrefix: "oidc:",
		},
		{
			name: "single authenticator with another issuer",
			authConfig: `
apiVersion: apiserver.config.k8s.io/v1beta1
kind: AuthenticationConfiguration
jwt:
- issuer:
    url: https://other.example.com
    audiences: [other]
  claimMappings:
    username: {claim: email, prefix: ""}
    groups: {claim: groups, prefix: "corp:"}
`,
			expectedPrefix: "corp:",
		},
		{
			name: "several authenticators and none matches the issuer",
			authConfig: `
jwt:
- issuer: {url: https://a.example.com}
  claimMappings:
    groups: {claim: groups, prefix: "a:"}
- issuer: {url: https://b.example.com}
  claimMappings:
    groups: {claim: groups, prefix: "b:"}
`,
			expectedError: true,
		},
		{
			name: "groups mapped with a CEL expression",
			authConfig: `
jwt:
- issuer: {url: https://kkp.example.com/dex}
  claimMappings:
    groups: {expression: '"oidc:" + claims.groups'}
`,
			expectedError: true,
		},
		{
			name: "groups claim without prefix",
			authConfig: `
jwt:
- issuer: {url: https://kkp.example.com/dex}
  claimMappings:
    groups: {claim: groups}
`,
			expectedPrefix: "",
		},
		{
			name:           "no JWT authenticators",
			authConfig:     `apiVersion: apiserver.config.k8s.io/v1`,
			expectedPrefix: "",
		},
		{
			name:          "empty configuration",
			authConfig:    "",
			expectedError: true,
		},
		{
			name:          "invalid configuration",
			authConfig:    `jwt: [`,
			expectedError: true,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			prefix, err := groupsPrefixFromAuthenticationConfiguration([]byte(tc.authConfig), issuerURL)
			if (err != nil) != tc.expectedError {
				t.Fatalf("expected error: %v, got: %v", tc.expectedError, err)
			}
			if prefix != tc.expectedPrefix {
				t.Fatalf("expected prefix %q, got %q", tc.expectedPrefix, prefix)
			}
		})
	}
}

func TestOIDCIssuerURL(t *testing.T) {
	t.Parallel()

	verifier := fakeIssuerVerifier{url: "https://kkp.example.com/dex"}

	if url := oidcIssuerURL(&kubermaticv1.Seed{}, verifier); url != "https://kkp.example.com/dex" {
		t.Errorf("expected the API issuer, got %q", url)
	}

	seed := &kubermaticv1.Seed{Spec: kubermaticv1.SeedSpec{OIDCProviderConfiguration: &kubermaticv1.OIDCProviderConfiguration{IssuerURL: "https://seed.example.com/dex"}}}
	if url := oidcIssuerURL(seed, verifier); url != "https://seed.example.com/dex" {
		t.Errorf("expected the seed issuer, got %q", url)
	}

	if url := oidcIssuerURL(nil, nil); url != "" {
		t.Errorf("expected no issuer, got %q", url)
	}
}

type fakeIssuerVerifier struct {
	authtypes.OIDCIssuerVerifier
	url string
}

func (f fakeIssuerVerifier) OIDCConfig() *authtypes.OIDCConfiguration {
	return &authtypes.OIDCConfiguration{URL: f.url}
}
