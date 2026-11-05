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

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
)

func TestEffectiveGroupsPrefix(t *testing.T) {
	t.Parallel()

	oidcEnabled := features.FeatureGate{features.OpenIDAuthPlugin: true}

	testcases := []struct {
		name           string
		oidc           kubermaticv1.OIDCSettings
		featureGates   features.FeatureGate
		expectedPrefix string
	}{
		{
			name:           "cluster OIDC settings use their own groups prefix",
			oidc:           kubermaticv1.OIDCSettings{IssuerURL: "https://dex.example.com", ClientID: "kubernetes", GroupsPrefix: "corp:"},
			featureGates:   oidcEnabled,
			expectedPrefix: "corp:",
		},
		{
			name:           "cluster OIDC settings without groups prefix",
			oidc:           kubermaticv1.OIDCSettings{IssuerURL: "https://dex.example.com", ClientID: "kubernetes"},
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
			cluster := &kubermaticv1.Cluster{Spec: kubermaticv1.ClusterSpec{OIDC: tc.oidc}}
			if prefix := effectiveGroupsPrefix(cluster, tc.featureGates); prefix != tc.expectedPrefix {
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
