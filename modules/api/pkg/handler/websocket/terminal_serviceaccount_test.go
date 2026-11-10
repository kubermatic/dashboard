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
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	ctrlruntimefakeclient "sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func TestNewImpersonation(t *testing.T) {
	impersonation := NewImpersonation("Bob@acme.com", []string{"devs", "ops"})

	// the email is not changed: the username in the user cluster is the email claim as it is
	assert.Equal(t, "Bob@acme.com", impersonation.User)
	assert.Equal(t, []string{"oidc:devs", "oidc:ops"}, impersonation.Groups)
}

func TestGenWebTerminalPod(t *testing.T) {
	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	name := userAppName(userEmailID)

	t.Run("OIDC mode mounts the kubeconfig Secret", func(t *testing.T) {
		pod := genWebTerminalPod(name, userEmailID, nil, nil, "")

		assert.Equal(t, modeOIDC, pod.Labels[modeLabelKey])
		assert.Empty(t, pod.Spec.ServiceAccountName)
		require.Len(t, pod.Spec.Containers, 1)
		assert.True(t, hasVolume(pod, resources.WEBTerminalKubeconfigSecretName))
		assert.True(t, hasMount(pod.Spec.Containers[0], resources.WEBTerminalKubeconfigSecretName))
	})

	t.Run("ServiceAccount mode keeps the token in the proxy sidecar", func(t *testing.T) {
		impersonation := NewImpersonation("bob@acme.com", []string{"devs"})
		pod := genWebTerminalPod(name, userEmailID, nil, impersonation, "")

		assert.Equal(t, modeServiceAccount, pod.Labels[modeLabelKey])
		assert.Equal(t, impersonation.hash(), pod.Annotations[identityAnnotationKey])
		assert.Equal(t, name, pod.Spec.ServiceAccountName)
		require.NotNil(t, pod.Spec.AutomountServiceAccountToken)
		assert.False(t, *pod.Spec.AutomountServiceAccountToken)

		// no Secret with the user's OIDC login
		assert.False(t, hasVolume(pod, resources.WEBTerminalKubeconfigSecretName))
		for _, volume := range pod.Spec.Volumes {
			assert.Nil(t, volume.Secret, "volume %s must not be a Secret", volume.Name)
		}

		require.Len(t, pod.Spec.Containers, 2)
		shell, proxy := pod.Spec.Containers[0], pod.Spec.Containers[1]

		// the shell is the container the terminal session is started in
		assert.Equal(t, name, shell.Name)
		assert.False(t, hasMount(shell, serviceAccountVolume), "the shell container must not get the ServiceAccount token")
		assert.False(t, hasMount(shell, resources.WEBTerminalKubeconfigSecretName))
		assert.Contains(t, shell.Env, corev1.EnvVar{Name: "KUBECONFIG", Value: shellKubeconfigPath})
		assert.Contains(t, shell.Args[0], "--server="+proxyAddress)

		assert.Equal(t, proxyContainerName, proxy.Name)
		assert.True(t, hasMount(proxy, serviceAccountVolume))
		// the identity is passed as arguments of the script, never as part of it
		assert.Equal(t, []string{"/bin/bash", "-c", proxyScript, proxyContainerName, "--as=bob@acme.com", "--as-group=oidc:devs"}, proxy.Command)
		assert.NotContains(t, proxyScript, "bob@acme.com")
		assert.Contains(t, proxyScript, "tokenFile: "+serviceAccountDir+"/token")
		assert.Contains(t, proxyScript, "'--reject-paths=^$'")
	})
}

func TestGenWebTerminalClusterRole(t *testing.T) {
	t.Run("user with groups", func(t *testing.T) {
		role := genWebTerminalClusterRole("webterminal-abc", NewImpersonation("bob@acme.com", []string{"devs", "ops"}))

		assert.Equal(t, []rbacv1.PolicyRule{
			{APIGroups: []string{""}, Resources: []string{"users"}, Verbs: []string{"impersonate"}, ResourceNames: []string{"bob@acme.com"}},
			{APIGroups: []string{""}, Resources: []string{"groups"}, Verbs: []string{"impersonate"}, ResourceNames: []string{"oidc:devs", "oidc:ops"}},
		}, role.Rules)
	})

	t.Run("user without groups gets no rule for groups", func(t *testing.T) {
		// a rule without resource names would allow to impersonate every group
		role := genWebTerminalClusterRole("webterminal-abc", NewImpersonation("bob@acme.com", nil))

		require.Len(t, role.Rules, 1)
		assert.Equal(t, []string{"users"}, role.Rules[0].Resources)
		assert.Equal(t, []string{"bob@acme.com"}, role.Rules[0].ResourceNames)
	})
}

func TestEnsureServiceAccountResources(t *testing.T) {
	ctx := context.Background()
	client := ctrlruntimefakeclient.NewClientBuilder().Build()
	name := "webterminal-abc"

	require.NoError(t, ensureServiceAccountResources(ctx, client, name, NewImpersonation("bob@acme.com", []string{"devs"})))

	sa := &corev1.ServiceAccount{}
	require.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: metav1.NamespaceSystem, Name: name}, sa))
	require.NotNil(t, sa.AutomountServiceAccountToken)
	assert.False(t, *sa.AutomountServiceAccountToken)

	binding := &rbacv1.ClusterRoleBinding{}
	require.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, binding))
	assert.Equal(t, name, binding.RoleRef.Name)
	assert.Equal(t, []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: name, Namespace: metav1.NamespaceSystem}}, binding.Subjects)

	// a later session of the same user with other groups updates the ClusterRole
	require.NoError(t, ensureServiceAccountResources(ctx, client, name, NewImpersonation("bob@acme.com", []string{"ops"})))

	role := &rbacv1.ClusterRole{}
	require.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, role))
	require.Len(t, role.Rules, 2)
	assert.Equal(t, []string{"oidc:ops"}, role.Rules[1].ResourceNames)
}

func TestPodMatchesSession(t *testing.T) {
	bob := NewImpersonation("bob@acme.com", []string{"devs"})
	podFor := func(impersonation *Impersonation) *corev1.Pod {
		return genWebTerminalPod("webterminal-abc", "abc", nil, impersonation, "")
	}

	testcases := []struct {
		name          string
		pod           *corev1.Pod
		impersonation *Impersonation
		expected      bool
	}{
		{name: "OIDC pod, OIDC session", pod: podFor(nil), expected: true},
		{name: "pod from a version without the mode label, OIDC session", pod: &corev1.Pod{}, expected: true},
		{name: "OIDC pod, ServiceAccount session", pod: podFor(nil), impersonation: bob, expected: false},
		{name: "pod from a version without the mode label, ServiceAccount session", pod: &corev1.Pod{}, impersonation: bob, expected: false},
		{name: "ServiceAccount pod, OIDC session", pod: podFor(bob), expected: false},
		{name: "ServiceAccount pod, same identity", pod: podFor(bob), impersonation: NewImpersonation("bob@acme.com", []string{"devs"}), expected: true},
		{name: "ServiceAccount pod, groups changed", pod: podFor(bob), impersonation: NewImpersonation("bob@acme.com", []string{"devs", "ops"}), expected: false},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, podMatchesSession(tc.pod, tc.impersonation))
		})
	}
}

func TestUnsupportedAuthenticationReason(t *testing.T) {
	authConfig := &kubermaticv1.AuthenticationConfiguration{SecretName: "auth", SecretKey: "config"}
	clusterInDC := func(modify func(*kubermaticv1.Cluster)) *kubermaticv1.Cluster {
		cluster := &kubermaticv1.Cluster{}
		cluster.Spec.Cloud.DatacenterName = "dc1"
		if modify != nil {
			modify(cluster)
		}
		return cluster
	}
	seedWith := func(modify func(*kubermaticv1.Seed)) *kubermaticv1.Seed {
		seed := &kubermaticv1.Seed{}
		seed.Spec.Datacenters = map[string]kubermaticv1.Datacenter{"dc1": {}, "dc2": {}}
		if modify != nil {
			modify(seed)
		}
		return seed
	}

	testcases := []struct {
		name                    string
		cluster                 *kubermaticv1.Cluster
		seed                    *kubermaticv1.Seed
		noDefaultAuthentication bool
		supported               bool
	}{
		{name: "default authentication", cluster: clusterInDC(nil), seed: seedWith(nil), supported: true},
		{name: "default authentication is not enabled", cluster: clusterInDC(nil), seed: seedWith(nil), noDefaultAuthentication: true},
		{
			name:    "cluster with its own AuthenticationConfiguration",
			cluster: clusterInDC(func(c *kubermaticv1.Cluster) { c.Spec.AuthenticationConfiguration = authConfig }),
			seed:    seedWith(nil),
		},
		{
			name: "cluster with spec.oidc",
			cluster: clusterInDC(func(c *kubermaticv1.Cluster) {
				c.Spec.OIDC = kubermaticv1.OIDCSettings{IssuerURL: "https://idp.example.com", ClientID: "client"}
			}),
			seed: seedWith(nil),
		},
		{
			name:    "seed with an AuthenticationConfiguration",
			cluster: clusterInDC(nil),
			seed:    seedWith(func(s *kubermaticv1.Seed) { s.Spec.AuthenticationConfiguration = authConfig }),
		},
		{
			name:    "seed with its own OIDC provider",
			cluster: clusterInDC(nil),
			seed: seedWith(func(s *kubermaticv1.Seed) {
				s.Spec.OIDCProviderConfiguration = &kubermaticv1.OIDCProviderConfiguration{}
			}),
		},
		{
			name:    "datacenter of the cluster with an AuthenticationConfiguration",
			cluster: clusterInDC(nil),
			seed: seedWith(func(s *kubermaticv1.Seed) {
				s.Spec.Datacenters["dc1"] = kubermaticv1.Datacenter{Spec: kubermaticv1.DatacenterSpec{AuthenticationConfiguration: authConfig}}
			}),
		},
		{
			name:    "another datacenter with an AuthenticationConfiguration",
			cluster: clusterInDC(nil),
			seed: seedWith(func(s *kubermaticv1.Seed) {
				s.Spec.Datacenters["dc2"] = kubermaticv1.Datacenter{Spec: kubermaticv1.DatacenterSpec{AuthenticationConfiguration: authConfig}}
			}),
			supported: true,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			reason := UnsupportedAuthenticationReason(tc.cluster, tc.seed, !tc.noDefaultAuthentication)
			assert.Equal(t, tc.supported, reason == "", "reason: %q", reason)
		})
	}
}

// TestWebTerminalCleanupJobDeletesServiceAccountObjects checks that the cleanup Job removes
// the objects of both modes, because a Job can outlive a switch of the mode.
func TestWebTerminalCleanupJobDeletesServiceAccountObjects(t *testing.T) {
	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	name := userAppName(userEmailID)
	script := genWebTerminalCleanupJob(name, userEmailID, "abcd1234", "").Spec.Template.Spec.Containers[0].Args[0]

	for _, deletion := range []string{
		"kubectl delete clusterrolebinding $USER_APP_NAME --ignore-not-found",
		"kubectl delete clusterrole $USER_APP_NAME --ignore-not-found",
		"kubectl delete serviceaccount $USER_APP_NAME -n $NAMESPACE_SYSTEM --ignore-not-found",
		"kubectl delete secret $KUBECONFIG_SECRET_NAME -n $NAMESPACE_SYSTEM --ignore-not-found",
	} {
		assert.Contains(t, script, deletion)
	}
}

func hasVolume(pod *corev1.Pod, name string) bool {
	return slices.ContainsFunc(pod.Spec.Volumes, func(v corev1.Volume) bool { return v.Name == name })
}

func hasMount(container corev1.Container, name string) bool {
	return slices.ContainsFunc(container.VolumeMounts, func(m corev1.VolumeMount) bool { return m.Name == name })
}
