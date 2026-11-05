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
	"strings"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
)

// defaultOIDCGroupsPrefix is the groups prefix KKP configures for the OpenIDAuthPlugin feature gate.
const defaultOIDCGroupsPrefix = "oidc:"

// resolveGroupSubjectName adds the cluster's OIDC groups prefix to group when oidcGroup is set.
func resolveGroupSubjectName(cluster *kubermaticv1.Cluster, featureGates features.FeatureGate, group string, oidcGroup bool) string {
	if group == "" || !oidcGroup {
		return group
	}
	return addGroupsPrefix(effectiveGroupsPrefix(cluster, featureGates), group)
}

// effectiveGroupsPrefix returns the --oidc-groups-prefix KKP sets on the cluster's kube-apiserver.
func effectiveGroupsPrefix(cluster *kubermaticv1.Cluster, featureGates features.FeatureGate) string {
	oidcSettings := cluster.Spec.OIDC

	switch {
	case oidcSettings.IssuerURL != "" && oidcSettings.ClientID != "":
		return oidcSettings.GroupsPrefix
	case featureGates.Enabled(features.OpenIDAuthPlugin):
		return defaultOIDCGroupsPrefix
	default:
		return ""
	}
}

func addGroupsPrefix(prefix, group string) string {
	if prefix == "" || strings.HasPrefix(group, prefix) {
		return group
	}
	return prefix + group
}
