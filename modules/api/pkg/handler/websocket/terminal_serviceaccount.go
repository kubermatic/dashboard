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
	"strings"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
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

	// defaultGroupsPrefix is the prefix KKP's default authentication entry puts in front
	// of the groups of an OIDC user in a user cluster.
	defaultGroupsPrefix = "oidc:"

	// WebTerminalAuthenticationUnsupported is sent when the web terminal runs as a ServiceAccount
	// and the user cluster does not use KKP's default authentication.
	WebTerminalAuthenticationUnsupported TerminalConnStatus = "WEBTERMINAL_AUTHENTICATION_UNSUPPORTED"
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
		impersonation.Groups = append(impersonation.Groups, defaultGroupsPrefix+group)
	}
	return impersonation
}

// hash identifies the impersonated identity, to detect a pod that was created for another one.
func (i *Impersonation) hash() string {
	sum := sha256.Sum256([]byte(strings.Join(append([]string{i.User}, i.Groups...), "\n")))
	return hex.EncodeToString(sum[:])
}

// UnsupportedAuthenticationReason returns why the web terminal can't run as a ServiceAccount
// on the given cluster, or an empty string if it can. The ServiceAccount impersonates the names
// KKP's default authentication entry gives a user; with any other authentication configuration
// the user's names in the cluster are not known. Without the default entry (OpenIDAuthPlugin
// feature gate) the cluster does not accept KKP logins at all.
func UnsupportedAuthenticationReason(cluster *kubermaticv1.Cluster, seed *kubermaticv1.Seed, defaultAuthenticationEnabled bool) string {
	if cluster.Spec.IsAuthenticationConfigurationEnabled() {
		return "the cluster uses its own AuthenticationConfiguration"
	}
	if cluster.Spec.OIDC.IssuerURL != "" && cluster.Spec.OIDC.ClientID != "" {
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
	if !defaultAuthenticationEnabled {
		return "user clusters do not accept KKP logins (OpenIDAuthPlugin feature gate is not enabled)"
	}
	return ""
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
// limits it to the session user. The ClusterRole is updated on every session start, so it
// follows changes of the user's groups.
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

	if err := client.Create(ctx, genWebTerminalClusterRoleBinding(userAppName)); err != nil && !apierrors.IsAlreadyExists(err) {
		return fmt.Errorf("failed to create ClusterRoleBinding: %w", err)
	}

	return nil
}

// proxyScript writes a kubeconfig for the ServiceAccount and starts kubectl proxy with it.
// The kubeconfig points at the token file, which kubectl re-reads, so the proxy keeps working
// when the token is rotated. An explicit kubeconfig is needed because kubectl does not fall back
// to the in-cluster configuration when impersonation flags are set.
// The reject paths are cleared because kubectl proxy rejects exec and attach by default.
const proxyScript = `cat > /tmp/kubeconfig <<EOF
apiVersion: v1
kind: Config
clusters:
- name: default
  cluster:
    server: https://kubernetes.default.svc
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

// proxyCommand passes the identity to impersonate as arguments of the script, so that
// the names are never interpreted by the shell.
func proxyCommand(impersonation *Impersonation) []string {
	cmd := []string{"/bin/bash", "-c", proxyScript, proxyContainerName, "--as=" + impersonation.User}
	for _, group := range impersonation.Groups {
		cmd = append(cmd, "--as-group="+group)
	}
	return cmd
}

// applyServiceAccountMode turns the web terminal pod into one that reaches the user cluster
// through a kubectl proxy sidecar. Only the sidecar gets the ServiceAccount token; the shell
// container gets a kubeconfig without credentials that points at the sidecar.
func applyServiceAccountMode(pod *corev1.Pod, userAppName string, impersonation *Impersonation) {
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
	pod.Spec.Volumes = append(volumes, corev1.Volume{
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
		Command: proxyCommand(impersonation),
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
