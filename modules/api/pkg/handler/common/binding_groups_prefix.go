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
	"context"
	"strings"

	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
)

// defaultOIDCGroupsPrefix is the groups prefix KKP configures on the user cluster kube-apiserver
// when the OpenIDAuthPlugin feature gate is enabled and no other authentication configuration is set.
const defaultOIDCGroupsPrefix = "oidc:"

// effectiveGroupsPrefix returns the prefix the user cluster's kube-apiserver adds to groups coming
// from the OIDC provider. The precedence mirrors the AuthenticationConfigurationReconciler in
// k8c.io/kubermatic/v2/pkg/resources/apiserver. A custom AuthenticationConfiguration (on the cluster,
// datacenter or seed) lives in a Secret the API does not parse, so an empty prefix is returned for it.
func effectiveGroupsPrefix(cluster *kubermaticv1.Cluster, datacenter *kubermaticv1.Datacenter, seed *kubermaticv1.Seed, featureGates features.FeatureGate) string {
	oidcSettings := cluster.Spec.OIDC //nolint:staticcheck

	switch {
	case cluster.Spec.IsAuthenticationConfigurationEnabled():
		return ""
	case datacenter != nil && datacenter.Spec.AuthenticationConfiguration != nil:
		return ""
	case seed != nil && seed.Spec.AuthenticationConfiguration != nil:
		return ""
	case oidcSettings.IssuerURL != "" && oidcSettings.ClientID != "":
		return oidcSettings.GroupsPrefix
	case featureGates.Enabled(features.OpenIDAuthPlugin):
		return defaultOIDCGroupsPrefix
	default:
		return ""
	}
}

// resolveGroupSubjectName returns the group name to use for an RBAC subject. When oidcGroup is set,
// the cluster's effective OIDC groups prefix is added, unless the name already carries it.
func resolveGroupSubjectName(ctx context.Context, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, featureGates features.FeatureGate, cluster *kubermaticv1.Cluster, group string, oidcGroup bool) (string, error) {
	if group == "" || !oidcGroup {
		return group, nil
	}

	adminUserInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return "", common.KubernetesErrorToHTTPError(err)
	}
	seed, datacenter, err := provider.DatacenterFromSeedMap(adminUserInfo, seedsGetter, cluster.Spec.Cloud.DatacenterName)
	if err != nil {
		return "", err
	}

	return addGroupsPrefix(effectiveGroupsPrefix(cluster, datacenter, seed, featureGates), group), nil
}

func addGroupsPrefix(prefix, group string) string {
	if prefix == "" || strings.HasPrefix(group, prefix) {
		return group
	}
	return prefix + group
}
