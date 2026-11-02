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
	"errors"
	"fmt"
	"strings"

	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	apiserverv1 "k8s.io/apiserver/pkg/apis/apiserver/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/yaml"
)

// defaultOIDCGroupsPrefix is the groups prefix KKP configures on the user cluster kube-apiserver
// when the OpenIDAuthPlugin feature gate is enabled and no other authentication configuration is set.
const defaultOIDCGroupsPrefix = "oidc:"

// resolveGroupSubjectName returns the group name to use for an RBAC subject. When oidcGroup is set,
// the cluster's effective OIDC groups prefix is added, unless the name already carries it.
func resolveGroupSubjectName(ctx context.Context, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, featureGates features.FeatureGate, oidcIssuerVerifier authtypes.OIDCIssuerVerifier, cluster *kubermaticv1.Cluster, group string, oidcGroup bool) (string, error) {
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

	privilegedClusterProvider, ok := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	if !ok {
		return "", errors.New("no privileged cluster provider in request context")
	}

	authConfig, found, err := getAuthenticationConfiguration(ctx, privilegedClusterProvider.GetSeedClusterAdminRuntimeClient(), cluster)
	if err != nil {
		return "", common.KubernetesErrorToHTTPError(err)
	}

	prefix := effectiveGroupsPrefix(cluster, datacenter, seed, featureGates)
	if found {
		prefix = groupsPrefixFromAuthenticationConfiguration(authConfig, oidcIssuerURL(seed, oidcIssuerVerifier))
	}

	return addGroupsPrefix(prefix, group), nil
}

// getAuthenticationConfiguration reads the AuthenticationConfiguration the user cluster's
// kube-apiserver is started with: the Secret referenced by the cluster, or else the one KKP
// generates in the cluster namespace (which also carries a datacenter or seed level configuration).
// found is false when the Secret does not exist yet, e.g. for a cluster that is still being created.
func getAuthenticationConfiguration(ctx context.Context, seedClient ctrlruntimeclient.Client, cluster *kubermaticv1.Cluster) ([]byte, bool, error) {
	if cluster.Status.NamespaceName == "" {
		return nil, false, nil
	}

	secretName := resources.ApiserverAuthenticationConfigurationSecretName
	secretKey := resources.AuthenticationConfigurationKey
	if cluster.Spec.IsAuthenticationConfigurationEnabled() {
		secretName = cluster.Spec.AuthenticationConfiguration.SecretName
		secretKey = cluster.Spec.AuthenticationConfiguration.SecretKey
	}

	secret := &corev1.Secret{}
	if err := seedClient.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: cluster.Status.NamespaceName, Name: secretName}, secret); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("failed to get authentication configuration secret %s/%s: %w", cluster.Status.NamespaceName, secretName, err)
	}

	return secret.Data[secretKey], true, nil
}

// groupsPrefixFromAuthenticationConfiguration returns the groups prefix of the JWT authenticator for
// issuerURL. When no authenticator matches and there is exactly one, that one is used. An empty prefix
// is returned when the configuration cannot be parsed, the authenticator cannot be determined, or its
// groups are mapped with a CEL expression, in which case the prefix (if any) is part of the expression.
func groupsPrefixFromAuthenticationConfiguration(data []byte, issuerURL string) string {
	authConfig := &apiserverv1.AuthenticationConfiguration{}
	if err := yaml.Unmarshal(data, authConfig); err != nil {
		return ""
	}

	var authenticator *apiserverv1.JWTAuthenticator
	for i := range authConfig.JWT {
		if sameIssuerURL(authConfig.JWT[i].Issuer.URL, issuerURL) {
			authenticator = &authConfig.JWT[i]
			break
		}
	}
	if authenticator == nil && len(authConfig.JWT) == 1 {
		authenticator = &authConfig.JWT[0]
	}
	if authenticator == nil {
		return ""
	}

	groups := authenticator.ClaimMappings.Groups
	if groups.Expression != "" || groups.Prefix == nil {
		return ""
	}

	return *groups.Prefix
}

// oidcIssuerURL returns the issuer users of the seed log in with: the seed's own OIDC provider if one
// is configured, the API's default issuer (--oidc-url) otherwise.
func oidcIssuerURL(seed *kubermaticv1.Seed, oidcIssuerVerifier authtypes.OIDCIssuerVerifier) string {
	if seed != nil && seed.Spec.OIDCProviderConfiguration != nil && seed.Spec.OIDCProviderConfiguration.IssuerURL != "" {
		return seed.Spec.OIDCProviderConfiguration.IssuerURL
	}
	if oidcIssuerVerifier != nil && oidcIssuerVerifier.OIDCConfig() != nil {
		return oidcIssuerVerifier.OIDCConfig().URL
	}
	return ""
}

func sameIssuerURL(a, b string) bool {
	return a != "" && b != "" && strings.TrimSuffix(a, "/") == strings.TrimSuffix(b, "/")
}

// effectiveGroupsPrefix derives the groups prefix from the cluster spec, for when the
// AuthenticationConfiguration Secret does not exist yet. The precedence mirrors the
// AuthenticationConfigurationReconciler in k8c.io/kubermatic/v2/pkg/resources/apiserver; a custom
// AuthenticationConfiguration can only be resolved from its Secret, so an empty prefix is returned for it.
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

func addGroupsPrefix(prefix, group string) string {
	if prefix == "" || strings.HasPrefix(group, prefix) {
		return group
	}
	return prefix + group
}
