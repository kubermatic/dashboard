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

package websocket

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"slices"
	"strings"

	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/equality"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	// modeLabelKey is set on the web terminal pod and tells how the pod authenticates
	// against the user cluster. Pods created before the label existed use the OIDC mode.
	modeLabelKey           = "webterminal-mode"
	modeOIDC               = "oidc"
	modeServiceAccount     = "serviceaccount"
	identityAnnotationKey  = "webterminal-identity"
	proxyContainerName     = "kubectl-proxy"
	proxyAddress           = "http://127.0.0.1:8001"
	serviceAccountTokenTTL = int64(3600)
	serviceAccountDir      = "/var/run/secrets/kubernetes.io/serviceaccount"
	serviceAccountVolume   = "web-terminal-serviceaccount"
	shellKubeconfigPath    = "/data/terminal/.kube/config"

	// WebTerminalAuthenticationUnsupported is sent when the web terminal runs as a ServiceAccount
	// and the user cluster does not use KKP's default authentication.
	WebTerminalAuthenticationUnsupported TerminalConnStatus = "WEBTERMINAL_AUTHENTICATION_UNSUPPORTED"
	// WebTerminalAuthenticationDisabled is sent when the web terminal runs as a ServiceAccount
	// and user clusters do not get KKP's default authentication (OpenIDAuthPlugin feature gate).
	WebTerminalAuthenticationDisabled TerminalConnStatus = "WEBTERMINAL_AUTHENTICATION_DISABLED"
	// WebTerminalEmailNotVerified is sent when the web terminal runs as a ServiceAccount
	// and the email of the login is not verified.
	WebTerminalEmailNotVerified TerminalConnStatus = "WEBTERMINAL_EMAIL_NOT_VERIFIED"
)

// Impersonation is the identity the web terminal acts as in the user cluster when it runs
// as a ServiceAccount: the names the user's own OIDC login has in that cluster.
type Impersonation struct {
	User   string
	Groups []string
}

// NewImpersonation maps the user's dashboard login to the names KKP's default authentication
// entry gives the same login in a user cluster: the email as username and the groups
// with the "oidc:" prefix.
func NewImpersonation(email string, groups []string) *Impersonation {
	impersonation := &Impersonation{User: email}
	for _, group := range groups {
		impersonation.Groups = append(impersonation.Groups, handlercommon.DefaultOIDCGroupsPrefix+group)
	}
	// a token does not list the groups in a fixed order, and the same groups must give the same identity
	slices.Sort(impersonation.Groups)
	impersonation.Groups = slices.Compact(impersonation.Groups)
	return impersonation
}

// hash identifies the impersonated identity, to detect a pod that was created for another one.
func (i *Impersonation) hash() string {
	sum := sha256.Sum256([]byte(strings.Join(append([]string{i.User}, i.Groups...), "\n")))
	return hex.EncodeToString(sum[:])
}

// ServiceAccountModeRefusal returns the status that tells the dashboard why the web terminal
// can't run as a ServiceAccount for a login on the given cluster, together with the reason for
// the log. The status is empty if it can.
//
// The ServiceAccount impersonates the names KKP's default authentication entry gives a user.
// With any other authentication configuration the user's names in the cluster are not known,
// and without the default entry (OpenIDAuthPlugin feature gate) the cluster does not accept
// KKP logins at all. The default entry does not accept a login with an unverified email, so
// the web terminal must not act for it either.
func ServiceAccountModeRefusal(cluster *kubermaticv1.Cluster, seed *kubermaticv1.Seed, defaultAuthenticationEnabled bool, emailVerified *bool) (TerminalConnStatus, string) {
	if reason := customAuthenticationReason(cluster, seed); reason != "" {
		return WebTerminalAuthenticationUnsupported, reason
	}
	if !defaultAuthenticationEnabled {
		return WebTerminalAuthenticationDisabled, "user clusters do not accept KKP logins (OpenIDAuthPlugin feature gate is not enabled)"
	}
	if emailVerified != nil && !*emailVerified {
		return WebTerminalEmailNotVerified, "the email of the login is not verified"
	}
	return "", ""
}

// customAuthenticationReason returns which setting replaces KKP's default authentication entry
// for the given cluster, or an empty string if none does.
func customAuthenticationReason(cluster *kubermaticv1.Cluster, seed *kubermaticv1.Seed) string {
	oidcSettings := cluster.Spec.OIDC //nolint:staticcheck

	if cluster.Spec.IsAuthenticationConfigurationEnabled() {
		return "the cluster uses its own AuthenticationConfiguration"
	}
	if oidcSettings.IssuerURL != "" && oidcSettings.ClientID != "" {
		return "the cluster uses its own OIDC settings"
	}
	if seed != nil {
		if seed.Spec.AuthenticationConfiguration != nil {
			return "the seed sets an AuthenticationConfiguration"
		}
		if seed.Spec.OIDCProviderConfiguration != nil {
			return "the seed uses its own OIDC provider"
		}
		if dc, ok := seed.Spec.Datacenters[cluster.Spec.Cloud.DatacenterName]; ok && dc.Spec.AuthenticationConfiguration != nil {
			return "the datacenter sets an AuthenticationConfiguration"
		}
	}
	return ""
}

// clusterAPIServerURL returns the address the web terminal reaches the kube-apiserver of the user
// cluster at. It is the address of the kubeconfigs KKP hands out, which the OIDC mode uses as
// well, so that the NetworkPolicy of the web terminal allows it with every expose strategy.
func clusterAPIServerURL(cluster *kubermaticv1.Cluster) string {
	if cluster.Status.Address.APIServerExternalAddress != "" {
		return cluster.Status.Address.APIServerExternalAddress
	}
	return cluster.Status.Address.URL
}

func podMode(impersonation *Impersonation) string {
	if impersonation != nil {
		return modeServiceAccount
	}
	return modeOIDC
}

// podMatchesSession returns false if the pod was created for the other mode or, in the
// ServiceAccount mode, for another identity (for example after the user's groups changed).
func podMatchesSession(pod *corev1.Pod, impersonation *Impersonation) bool {
	mode := pod.Labels[modeLabelKey]
	if mode == "" {
		mode = modeOIDC
	}
	if mode != podMode(impersonation) {
		return false
	}
	return impersonation == nil || pod.Annotations[identityAnnotationKey] == impersonation.hash()
}

func webTerminalLabels() map[string]string {
	return map[string]string{resources.AppLabelKey: appName}
}

func genWebTerminalServiceAccount(userAppName string) *corev1.ServiceAccount {
	return &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      userAppName,
			Namespace: metav1.NamespaceSystem,
			Labels:    webTerminalLabels(),
		},
		AutomountServiceAccountToken: resources.Bool(false),
	}
}

// genWebTerminalClusterRole allows to impersonate the session user and that user's groups, nothing else.
func genWebTerminalClusterRole(userAppName string, impersonation *Impersonation) *rbacv1.ClusterRole {
	rules := []rbacv1.PolicyRule{
		{
			APIGroups:     []string{""},
			Resources:     []string{"users"},
			Verbs:         []string{"impersonate"},
			ResourceNames: []string{impersonation.User},
		},
	}
	if len(impersonation.Groups) > 0 {
		rules = append(rules, rbacv1.PolicyRule{
			APIGroups:     []string{""},
			Resources:     []string{"groups"},
			Verbs:         []string{"impersonate"},
			ResourceNames: impersonation.Groups,
		})
	}

	return &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name:   userAppName,
			Labels: webTerminalLabels(),
		},
		Rules: rules,
	}
}

func genWebTerminalClusterRoleBinding(userAppName string) *rbacv1.ClusterRoleBinding {
	return &rbacv1.ClusterRoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:   userAppName,
			Labels: webTerminalLabels(),
		},
		RoleRef: rbacv1.RoleRef{
			APIGroup: rbacv1.GroupName,
			Kind:     "ClusterRole",
			Name:     userAppName,
		},
		Subjects: []rbacv1.Subject{
			{
				Kind:      rbacv1.ServiceAccountKind,
				Name:      userAppName,
				Namespace: metav1.NamespaceSystem,
			},
		},
	}
}

// ensureServiceAccountResources creates the ServiceAccount of the session and the RBAC that
// limits it to the session user. It runs for every connection: the ClusterRole follows changes
// of the user's groups, and a binding that is as it should be is left alone, so that the
// sessions of other connections of the user are not disturbed.
func ensureServiceAccountResources(ctx context.Context, client ctrlruntimeclient.Client, userAppName string, impersonation *Impersonation) error {
	if err := client.Create(ctx, genWebTerminalServiceAccount(userAppName)); err != nil && !apierrors.IsAlreadyExists(err) {
		return fmt.Errorf("failed to create ServiceAccount: %w", err)
	}

	clusterRole := genWebTerminalClusterRole(userAppName, impersonation)
	if err := client.Create(ctx, clusterRole); err != nil {
		if !apierrors.IsAlreadyExists(err) {
			return fmt.Errorf("failed to create ClusterRole: %w", err)
		}
		if err := client.Update(ctx, clusterRole); err != nil {
			return fmt.Errorf("failed to update ClusterRole: %w", err)
		}
	}

	binding := genWebTerminalClusterRoleBinding(userAppName)
	existing := &rbacv1.ClusterRoleBinding{}
	err := client.Get(ctx, ctrlruntimeclient.ObjectKeyFromObject(binding), existing)
	if err != nil && !apierrors.IsNotFound(err) {
		return fmt.Errorf("failed to get ClusterRoleBinding: %w", err)
	}
	if err == nil {
		if equality.Semantic.DeepEqual(existing.RoleRef, binding.RoleRef) && equality.Semantic.DeepEqual(existing.Subjects, binding.Subjects) {
			return nil
		}
		// A binding with this name must not keep other subjects or another role. Its roleRef
		// can't be updated, so the binding is replaced.
		if err := client.Delete(ctx, existing); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("failed to replace ClusterRoleBinding: %w", err)
		}
	}
	if err := client.Create(ctx, binding); err != nil && !apierrors.IsAlreadyExists(err) {
		return fmt.Errorf("failed to create ClusterRoleBinding: %w", err)
	}

	return nil
}

// deleteKubeconfigSecret removes the Secret with the user's OIDC login from the user cluster.
// Only the OIDC mode of the web terminal uses that Secret.
func deleteKubeconfigSecret(ctx context.Context, client ctrlruntimeclient.Client, userEmailID string) error {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      handlercommon.KubeconfigSecretName(userEmailID),
			Namespace: metav1.NamespaceSystem,
		},
	}
	if err := client.Delete(ctx, secret); err != nil && !apierrors.IsNotFound(err) {
		return fmt.Errorf("failed to delete the kubeconfig Secret: %w", err)
	}
	return nil
}

// proxyScript writes a kubeconfig for the ServiceAccount and starts kubectl proxy with it.
// The kubeconfig points at the token file, which kubectl re-reads, so the proxy keeps working
// when the token is rotated. An explicit kubeconfig is needed because kubectl does not fall back
// to the in-cluster configuration when impersonation flags are set. The kubeconfig has no server:
// the address of the kube-apiserver is one of the arguments, see proxyCommand.
// The reject paths are cleared because kubectl proxy rejects exec and attach by default.
const proxyScript = `cat > /tmp/kubeconfig <<EOF
apiVersion: v1
kind: Config
clusters:
- name: default
  cluster:
    certificate-authority: ` + serviceAccountDir + `/ca.crt
users:
- name: default
  user:
    tokenFile: ` + serviceAccountDir + `/token
contexts:
- name: default
  context:
    cluster: default
    user: default
current-context: default
EOF
exec kubectl proxy --kubeconfig=/tmp/kubeconfig --address=127.0.0.1 --port=8001 '--reject-paths=^$' "$@"`

// proxyCommand passes the address of the kube-apiserver and the identity to impersonate as
// arguments of the script, so that they are never interpreted by the shell.
func proxyCommand(apiServerURL string, impersonation *Impersonation) []string {
	cmd := []string{"/bin/bash", "-c", proxyScript, proxyContainerName, "--server=" + apiServerURL, "--as=" + impersonation.User}
	for _, group := range impersonation.Groups {
		cmd = append(cmd, "--as-group="+group)
	}
	return cmd
}

// applyServiceAccountMode turns the web terminal pod into one that reaches the user cluster
// through a kubectl proxy sidecar. Only the sidecar gets the ServiceAccount token; the shell
// container gets a kubeconfig without credentials that points at the sidecar.
func applyServiceAccountMode(pod *corev1.Pod, userAppName, apiServerURL string, impersonation *Impersonation) {
	pod.Labels[modeLabelKey] = modeServiceAccount
	pod.Annotations = map[string]string{identityAnnotationKey: impersonation.hash()}
	pod.Spec.ServiceAccountName = userAppName
	pod.Spec.AutomountServiceAccountToken = resources.Bool(false)

	// replace the kubeconfig Secret with the ServiceAccount token, mounted in the sidecar only
	volumes := []corev1.Volume{}
	for _, volume := range pod.Spec.Volumes {
		if volume.Name != resources.WEBTerminalKubeconfigSecretName {
			volumes = append(volumes, volume)
		}
	}
	volumes = append(volumes, corev1.Volume{
		Name: serviceAccountVolume,
		VolumeSource: corev1.VolumeSource{
			Projected: &corev1.ProjectedVolumeSource{
				Sources: []corev1.VolumeProjection{
					{
						ServiceAccountToken: &corev1.ServiceAccountTokenProjection{
							Path:              "token",
							ExpirationSeconds: resources.Int64(serviceAccountTokenTTL),
						},
					},
					{
						ConfigMap: &corev1.ConfigMapProjection{
							LocalObjectReference: corev1.LocalObjectReference{Name: "kube-root-ca.crt"},
							Items:                []corev1.KeyToPath{{Key: "ca.crt", Path: "ca.crt"}},
						},
					},
					{
						DownwardAPI: &corev1.DownwardAPIProjection{
							Items: []corev1.DownwardAPIVolumeFile{{
								Path:     "namespace",
								FieldRef: &corev1.ObjectFieldSelector{APIVersion: "v1", FieldPath: "metadata.namespace"},
							}},
						},
					},
				},
			},
		},
	})
	pod.Spec.Volumes = volumes

	shell := &pod.Spec.Containers[0]
	mounts := []corev1.VolumeMount{}
	for _, mount := range shell.VolumeMounts {
		if mount.Name != resources.WEBTerminalKubeconfigSecretName {
			mounts = append(mounts, mount)
		}
	}
	shell.VolumeMounts = mounts
	for i := range shell.Env {
		if shell.Env[i].Name == "KUBECONFIG" {
			shell.Env[i].Value = shellKubeconfigPath
		}
	}
	shell.Args = []string{
		"kubectl config set-cluster default --server=" + proxyAddress + " > /dev/null && " +
			"kubectl config set-context default --cluster=default > /dev/null && " +
			"kubectl config use-context default > /dev/null; " +
			"while true; do sleep 30; done;",
	}

	pod.Spec.Containers = append(pod.Spec.Containers, corev1.Container{
		Name:    proxyContainerName,
		Image:   shell.Image,
		Command: proxyCommand(apiServerURL, impersonation),
		VolumeMounts: []corev1.VolumeMount{
			{
				Name:      serviceAccountVolume,
				MountPath: serviceAccountDir,
				ReadOnly:  true,
			},
		},
		SecurityContext: &corev1.SecurityContext{
			AllowPrivilegeEscalation: resources.Bool(false),
		},
	})
}
