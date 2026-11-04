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
	"bytes"
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
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	apiserverv1 "k8s.io/apiserver/pkg/apis/apiserver/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/yaml"
)

// defaultOIDCGroupsPrefix is the groups prefix KKP generates for the OpenIDAuthPlugin feature gate.
const defaultOIDCGroupsPrefix = "oidc:"

// resolveGroupSubjectName adds the cluster's OIDC groups prefix to group when oidcGroup is set.
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
		prefix, err = groupsPrefixFromAuthenticationConfiguration(authConfig, oidcIssuerURL(seed, oidcIssuerVerifier))
		if err != nil {
			return "", utilerrors.NewBadRequest("cannot determine the OIDC groups prefix of the cluster: %v; set the group name as the kube-apiserver sees it and disable the OIDC group option", err)
		}
	}

	return addGroupsPrefix(prefix, group), nil
}

// getAuthenticationConfiguration returns the AuthenticationConfiguration the cluster's kube-apiserver
// is started with; found is false when its Secret does not exist.
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
// issuerURL, or of the only JWT authenticator if none matches.
func groupsPrefixFromAuthenticationConfiguration(data []byte, issuerURL string) (string, error) {
	if len(bytes.TrimSpace(data)) == 0 {
		return "", errors.New("the authentication configuration is empty")
	}

	authConfig := &apiserverv1.AuthenticationConfiguration{}
	if err := yaml.Unmarshal(data, authConfig); err != nil {
		return "", fmt.Errorf("failed to parse the authentication configuration: %w", err)
	}
	if len(authConfig.JWT) == 0 {
		return "", nil
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
		return "", fmt.Errorf("none of the JWT authenticators matches the OIDC issuer %q", issuerURL)
	}

	groups := authenticator.ClaimMappings.Groups
	if groups.Expression != "" {
		return "", fmt.Errorf("the groups of the JWT authenticator for %q are mapped with a CEL expression", authenticator.Issuer.URL)
	}
	if groups.Prefix == nil {
		return "", nil
	}

	return *groups.Prefix, nil
}

// oidcIssuerURL returns the seed's OIDC issuer, or the API's default one (--oidc-url).
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

// effectiveGroupsPrefix derives the groups prefix from the cluster spec when the AuthenticationConfiguration
// Secret does not exist, following KKP's AuthenticationConfigurationReconciler.
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
