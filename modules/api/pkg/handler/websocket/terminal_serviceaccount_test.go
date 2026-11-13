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
	"fmt"
	"net/url"
	"slices"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	ctrlruntimefakeclient "sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

const testAPIServerURL = "https://abcd1234.kubermatic.example.com:6443"

// genTestCluster returns a cluster that is exposed like one with the Tunneling strategy: the
// address of its kube-apiserver is not the address of the kubernetes Service in the cluster.
func genTestCluster() *kubermaticv1.Cluster {
	cluster := &kubermaticv1.Cluster{}
	cluster.Name = "abcd1234"
	cluster.Spec.ClusterNetwork.Services.CIDRBlocks = []string{"10.240.16.0/20"}
	cluster.Status.Address = kubermaticv1.ClusterAddress{
		URL:          testAPIServerURL,
		ExternalName: "abcd1234.kubermatic.example.com",
		IP:           "203.0.113.10",
		Port:         6443,
	}
	return cluster
}

func TestNewImpersonation(t *testing.T) {
	impersonation := NewImpersonation("Bob@acme.com", []string{"ops", "devs", "ops"})

	// the email is not changed: the username in the user cluster is the email claim as it is
	assert.Equal(t, "Bob@acme.com", impersonation.User)
	// every group once and in a fixed order, whatever the order in the token is
	assert.Equal(t, []string{"oidc:devs", "oidc:ops"}, impersonation.Groups)
	assert.Equal(t, NewImpersonation("Bob@acme.com", []string{"devs", "ops"}).hash(), impersonation.hash())

	assert.Empty(t, NewImpersonation("Bob@acme.com", nil).Groups)
}

func TestGenWebTerminalPod(t *testing.T) {
	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	name := userAppName(userEmailID)

	t.Run("OIDC mode mounts the kubeconfig Secret", func(t *testing.T) {
		pod := genWebTerminalPod(name, userEmailID, testAPIServerURL, nil, nil, "")

		assert.Equal(t, modeOIDC, pod.Labels[modeLabelKey])
		assert.Empty(t, pod.Spec.ServiceAccountName)
		require.Len(t, pod.Spec.Containers, 1)
		assert.True(t, hasVolume(pod, resources.WEBTerminalKubeconfigSecretName))
		assert.True(t, hasMount(pod.Spec.Containers[0], resources.WEBTerminalKubeconfigSecretName))
	})

	t.Run("ServiceAccount mode keeps the token in the proxy sidecar", func(t *testing.T) {
		impersonation := NewImpersonation("bob@acme.com", []string{"devs"})
		pod := genWebTerminalPod(name, userEmailID, testAPIServerURL, nil, impersonation, "")

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
		// the address of the kube-apiserver and the identity are passed as arguments of the script, never as part of it
		assert.Equal(t, []string{"/bin/bash", "-c", proxyScript, proxyContainerName, "--server=" + testAPIServerURL, "--as=bob@acme.com", "--as-group=oidc:devs"}, proxy.Command)
		assert.NotContains(t, proxyScript, "bob@acme.com")
		assert.NotContains(t, proxyScript, "server:")
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

// TestEnsureServiceAccountResourcesReplacesClusterRoleBinding checks that a binding with the name
// of the session can't give the ServiceAccount another role, or the role to another subject.
func TestEnsureServiceAccountResourcesReplacesClusterRoleBinding(t *testing.T) {
	ctx := context.Background()
	name := "webterminal-abc"
	expected := genWebTerminalClusterRoleBinding(name)

	testcases := []struct {
		name     string
		modify   func(*rbacv1.ClusterRoleBinding)
		replaced bool
	}{
		{
			name:     "another role",
			modify:   func(binding *rbacv1.ClusterRoleBinding) { binding.RoleRef.Name = "cluster-admin" },
			replaced: true,
		},
		{
			name: "another subject",
			modify: func(binding *rbacv1.ClusterRoleBinding) {
				binding.Subjects = append(binding.Subjects, rbacv1.Subject{Kind: rbacv1.ServiceAccountKind, Name: "other", Namespace: metav1.NamespaceDefault})
			},
			replaced: true,
		},
		{
			// replacing the binding of a running session would interrupt it
			name:   "the binding of the session",
			modify: func(*rbacv1.ClusterRoleBinding) {},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			existing := genWebTerminalClusterRoleBinding(name)
			existing.Annotations = map[string]string{"existing": "true"}
			tc.modify(existing)
			client := ctrlruntimefakeclient.NewClientBuilder().WithObjects(existing).Build()

			require.NoError(t, ensureServiceAccountResources(ctx, client, name, NewImpersonation("bob@acme.com", nil)))

			binding := &rbacv1.ClusterRoleBinding{}
			require.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, binding))
			assert.Equal(t, expected.RoleRef, binding.RoleRef)
			assert.Equal(t, expected.Subjects, binding.Subjects)
			assert.Equal(t, tc.replaced, binding.Annotations["existing"] == "")
		})
	}
}

// TestServiceAccountModeUsesTheAddressTheNetworkPolicyAllows checks that the proxy sidecar reaches the
// kube-apiserver at the address the NetworkPolicy of the web terminal allows. The kubernetes Service
// of the user cluster is not such an address: with the Tunneling expose strategy its endpoint is the
// tunneling agent, which the NetworkPolicy does not allow.
func TestServiceAccountModeUsesTheAddressTheNetworkPolicyAllows(t *testing.T) {
	cluster := genTestCluster()
	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	name := userAppName(userEmailID)

	pod := genWebTerminalPod(name, userEmailID, clusterAPIServerURL(cluster), nil, NewImpersonation("bob@acme.com", nil), "")
	require.Len(t, pod.Spec.Containers, 2)

	server := ""
	for _, arg := range pod.Spec.Containers[1].Command {
		if value, ok := strings.CutPrefix(arg, "--server="); ok {
			server = value
		}
	}
	serverURL, err := url.Parse(server)
	require.NoError(t, err)
	assert.Equal(t, cluster.Status.Address.ExternalName, serverURL.Hostname())
	assert.Equal(t, fmt.Sprint(cluster.Status.Address.Port), serverURL.Port())

	policy, err := genWebTerminalNetworkPolicy(name, cluster, nil)
	require.NoError(t, err)
	allowed := slices.ContainsFunc(policy.Spec.Egress, func(rule networkingv1.NetworkPolicyEgressRule) bool {
		return len(rule.To) == 1 && rule.To[0].IPBlock != nil && rule.To[0].IPBlock.CIDR == cluster.Status.Address.IP+"/32" &&
			len(rule.Ports) == 1 && rule.Ports[0].Port.String() == serverURL.Port()
	})
	assert.True(t, allowed, "the NetworkPolicy must allow the address of the kube-apiserver the proxy uses")
}

func TestClusterAPIServerURL(t *testing.T) {
	cluster := genTestCluster()
	assert.Equal(t, testAPIServerURL, clusterAPIServerURL(cluster))

	// the same precedence as in the kubeconfigs KKP hands out
	cluster.Status.Address.APIServerExternalAddress = "https://lb.example.com"
	assert.Equal(t, "https://lb.example.com", clusterAPIServerURL(cluster))
}

// newFakeUserClusterClient returns a fake client that updates a NetworkPolicy without a
// resourceVersion like the kube-apiserver does. The fake client refuses such an update, because
// it looks the kind up in the API group "networking" instead of "networking.k8s.io".
func newFakeUserClusterClient(objects ...ctrlruntimeclient.Object) ctrlruntimeclient.Client {
	return ctrlruntimefakeclient.NewClientBuilder().WithObjects(objects...).WithInterceptorFuncs(interceptor.Funcs{
		Update: func(ctx context.Context, client ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, opts ...ctrlruntimeclient.UpdateOption) error {
			if policy, ok := obj.(*networkingv1.NetworkPolicy); ok && policy.ResourceVersion == "" {
				existing := &networkingv1.NetworkPolicy{}
				if err := client.Get(ctx, ctrlruntimeclient.ObjectKeyFromObject(policy), existing); err != nil {
					return err
				}
				policy.ResourceVersion = existing.ResourceVersion
			}
			return client.Update(ctx, obj, opts...)
		},
	}).Build()
}

// TestEnsureSessionResources checks what a new connection to the web terminal does with the objects
// an earlier session of the same user has left in the user cluster.
func TestEnsureSessionResources(t *testing.T) {
	ctx := context.Background()
	cluster := genTestCluster()
	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	name := userAppName(userEmailID)
	podKey := ctrlruntimeclient.ObjectKey{Namespace: metav1.NamespaceSystem, Name: name}
	secretKey := ctrlruntimeclient.ObjectKey{Namespace: metav1.NamespaceSystem, Name: handlercommon.KubeconfigSecretName(userEmailID)}
	jobKey := ctrlruntimeclient.ObjectKey{Namespace: "cluster-" + cluster.Name, Name: "cleanup-" + name}
	bob := NewImpersonation("bob@acme.com", []string{"devs"})

	kubeconfigSecret := func(userEmailID string) *corev1.Secret {
		return &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Namespace: metav1.NamespaceSystem, Name: handlercommon.KubeconfigSecretName(userEmailID)}}
	}
	// marks the pod, to tell later whether it was replaced
	markPod := func(t *testing.T, client ctrlruntimeclient.Client) {
		pod := &corev1.Pod{}
		require.NoError(t, client.Get(ctx, podKey, pod))
		pod.Labels["marked"] = "true"
		require.NoError(t, client.Update(ctx, pod))
	}
	podOf := func(t *testing.T, client ctrlruntimeclient.Client) *corev1.Pod {
		pod := &corev1.Pod{}
		require.NoError(t, client.Get(ctx, podKey, pod))
		return pod
	}

	t.Run("a ServiceAccount session replaces the pod of an OIDC session and removes its Secret", func(t *testing.T) {
		otherUserEmailID := EncodeUserEmailtoID("alice@acme.com")
		client := newFakeUserClusterClient(
			genWebTerminalPod(name, userEmailID, "", nil, nil, ""),
			kubeconfigSecret(userEmailID),
			kubeconfigSecret(otherUserEmailID),
		)
		seedClient := ctrlruntimefakeclient.NewClientBuilder().WithObjects(genWebTerminalCleanupJob(name, userEmailID, cluster.Name, "")).Build()
		markPod(t, client)

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))

		pod := podOf(t, client)
		assert.Equal(t, modeServiceAccount, pod.Labels[modeLabelKey])
		assert.NotContains(t, pod.Labels, "marked")
		assert.True(t, apierrors.IsNotFound(client.Get(ctx, secretKey, &corev1.Secret{})), "the Secret with the OIDC login of the user must be removed")
		// the Secret of another user, whose session may still be open, stays
		assert.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKeyFromObject(kubeconfigSecret(otherUserEmailID)), &corev1.Secret{}))

		assert.NoError(t, client.Get(ctx, podKey, &corev1.ServiceAccount{}))
		assert.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, &rbacv1.ClusterRole{}))
		assert.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, &rbacv1.ClusterRoleBinding{}))
		assert.NoError(t, client.Get(ctx, podKey, &corev1.ConfigMap{}))
		assert.NoError(t, seedClient.Get(ctx, jobKey, &batchv1.Job{}))
	})

	t.Run("a ServiceAccount session removes a Secret that was left without a pod", func(t *testing.T) {
		client := newFakeUserClusterClient(kubeconfigSecret(userEmailID))
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))

		assert.True(t, apierrors.IsNotFound(client.Get(ctx, secretKey, &corev1.Secret{})))
		assert.Equal(t, modeServiceAccount, podOf(t, client).Labels[modeLabelKey])
	})

	t.Run("a ServiceAccount session removes a Secret that appeared while its pod is running", func(t *testing.T) {
		client := newFakeUserClusterClient()
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()
		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))
		markPod(t, client)
		require.NoError(t, client.Create(ctx, kubeconfigSecret(userEmailID)))

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))

		assert.True(t, apierrors.IsNotFound(client.Get(ctx, secretKey, &corev1.Secret{})))
		assert.Contains(t, podOf(t, client).Labels, "marked", "the pod of the same identity must be kept")
	})

	t.Run("a ServiceAccount session with other groups replaces the pod and updates the ClusterRole", func(t *testing.T) {
		client := newFakeUserClusterClient()
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()
		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))
		markPod(t, client)

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, NewImpersonation("bob@acme.com", []string{"devs", "ops"}), ""))

		pod := podOf(t, client)
		assert.NotContains(t, pod.Labels, "marked")
		assert.Contains(t, pod.Spec.Containers[1].Command, "--as-group=oidc:ops")
		role := &rbacv1.ClusterRole{}
		require.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, role))
		assert.Equal(t, []string{"oidc:devs", "oidc:ops"}, role.Rules[1].ResourceNames)
		assert.NoError(t, seedClient.Get(ctx, jobKey, &batchv1.Job{}))
	})

	t.Run("the cleanup Job of an earlier session is replaced before the objects of the new session are created", func(t *testing.T) {
		// the Job removes the objects of the web terminal by name, also the ones of a new session
		leftover := genWebTerminalCleanupJob(name, userEmailID, cluster.Name, "")
		leftover.Labels["leftover"] = "true"
		client := newFakeUserClusterClient()
		created := []string{}
		seedClient := ctrlruntimefakeclient.NewClientBuilder().WithObjects(leftover).WithInterceptorFuncs(interceptor.Funcs{
			Delete: func(ctx context.Context, seedClient ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, opts ...ctrlruntimeclient.DeleteOption) error {
				// nothing of the new session exists while the Job of the earlier one is removed
				assert.True(t, apierrors.IsNotFound(client.Get(ctx, podKey, &corev1.ServiceAccount{})))
				assert.True(t, apierrors.IsNotFound(client.Get(ctx, podKey, &corev1.Pod{})))
				created = append(created, "job deleted")
				return seedClient.Delete(ctx, obj, opts...)
			},
			Create: func(ctx context.Context, seedClient ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, opts ...ctrlruntimeclient.CreateOption) error {
				created = append(created, "job created")
				return seedClient.Create(ctx, obj, opts...)
			},
		}).Build()

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))

		assert.Equal(t, []string{"job deleted", "job created"}, created)
		job := &batchv1.Job{}
		require.NoError(t, seedClient.Get(ctx, jobKey, job))
		assert.NotContains(t, job.Labels, "leftover")
		assert.NoError(t, client.Get(ctx, podKey, &corev1.ServiceAccount{}))
		assert.Equal(t, modeServiceAccount, podOf(t, client).Labels[modeLabelKey])
	})

	t.Run("a pod that is being removed is replaced", func(t *testing.T) {
		// the cleanup of an expired session is removing the pod; the fake client keeps a deleted
		// object with a finalizer, like the API does with a pod until its containers have stopped
		terminating := genWebTerminalPod(name, userEmailID, testAPIServerURL, nil, bob, "")
		terminating.Labels["marked"] = "true"
		terminating.Finalizers = []string{"test/containers-are-stopping"}
		client := ctrlruntimefakeclient.NewClientBuilder().WithObjects(terminating).WithInterceptorFuncs(interceptor.Funcs{
			Delete: func(ctx context.Context, client ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, opts ...ctrlruntimeclient.DeleteOption) error {
				// deleting the pod once more without a grace period makes it go away
				existing := &corev1.Pod{}
				if _, ok := obj.(*corev1.Pod); ok && client.Get(ctx, ctrlruntimeclient.ObjectKeyFromObject(obj), existing) == nil && existing.DeletionTimestamp != nil {
					existing.Finalizers = nil
					return client.Update(ctx, existing)
				}
				return client.Delete(ctx, obj, opts...)
			},
		}).Build()
		seedClient := ctrlruntimefakeclient.NewClientBuilder().WithObjects(genWebTerminalCleanupJob(name, userEmailID, cluster.Name, "")).Build()
		require.NoError(t, client.Delete(ctx, terminating.DeepCopy()))
		require.NotNil(t, podOf(t, client).DeletionTimestamp)

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))

		pod := podOf(t, client)
		assert.Nil(t, pod.DeletionTimestamp)
		assert.NotContains(t, pod.Labels, "marked")
		assert.NoError(t, seedClient.Get(ctx, jobKey, &batchv1.Job{}))
	})

	t.Run("a connection to a running session restores its ServiceAccount, RBAC and cleanup Job", func(t *testing.T) {
		client := newFakeUserClusterClient()
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()
		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))
		markPod(t, client)
		require.NoError(t, client.Delete(ctx, genWebTerminalServiceAccount(name)))
		require.NoError(t, client.Delete(ctx, genWebTerminalClusterRole(name, bob)))
		require.NoError(t, client.Delete(ctx, genWebTerminalClusterRoleBinding(name)))
		require.NoError(t, seedClient.Delete(ctx, genWebTerminalCleanupJob(name, userEmailID, cluster.Name, "")))

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))

		assert.Contains(t, podOf(t, client).Labels, "marked", "the pod of the session must be kept")
		assert.NoError(t, client.Get(ctx, podKey, &corev1.ServiceAccount{}))
		assert.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, &rbacv1.ClusterRole{}))
		assert.NoError(t, client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, &rbacv1.ClusterRoleBinding{}))
		assert.NoError(t, seedClient.Get(ctx, jobKey, &batchv1.Job{}))
	})

	t.Run("the cleanup Job exists before the objects it removes", func(t *testing.T) {
		// if the pod can't be created, the Job still removes what was created for the session
		podRefused := fmt.Errorf("the pod is refused")
		client := ctrlruntimefakeclient.NewClientBuilder().WithInterceptorFuncs(interceptor.Funcs{
			Create: func(ctx context.Context, client ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, opts ...ctrlruntimeclient.CreateOption) error {
				if _, ok := obj.(*corev1.Pod); ok {
					return podRefused
				}
				return client.Create(ctx, obj, opts...)
			},
		}).Build()
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()

		require.ErrorIs(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""), podRefused)

		assert.NoError(t, client.Get(ctx, podKey, &corev1.ServiceAccount{}))
		assert.NoError(t, client.Get(ctx, podKey, &corev1.ConfigMap{}), "the Job reads the expiration time from the ConfigMap")
		assert.NoError(t, seedClient.Get(ctx, jobKey, &batchv1.Job{}))
	})

	t.Run("an OIDC session keeps the Secret and creates no ServiceAccount", func(t *testing.T) {
		client := newFakeUserClusterClient(kubeconfigSecret(userEmailID))
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, nil, ""))

		assert.NoError(t, client.Get(ctx, secretKey, &corev1.Secret{}))
		assert.Equal(t, modeOIDC, podOf(t, client).Labels[modeLabelKey])
		assert.True(t, apierrors.IsNotFound(client.Get(ctx, podKey, &corev1.ServiceAccount{})))
		assert.True(t, apierrors.IsNotFound(client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: name}, &rbacv1.ClusterRoleBinding{})))
	})

	t.Run("an OIDC session replaces the pod of a ServiceAccount session", func(t *testing.T) {
		client := newFakeUserClusterClient()
		seedClient := ctrlruntimefakeclient.NewClientBuilder().Build()
		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, bob, ""))
		require.NoError(t, client.Create(ctx, kubeconfigSecret(userEmailID)))

		require.NoError(t, ensureSessionResources(ctx, client, seedClient, userEmailID, cluster, nil, nil, ""))

		pod := podOf(t, client)
		assert.Equal(t, modeOIDC, pod.Labels[modeLabelKey])
		assert.Empty(t, pod.Spec.ServiceAccountName)
		assert.NoError(t, client.Get(ctx, secretKey, &corev1.Secret{}))
		assert.NoError(t, seedClient.Get(ctx, jobKey, &batchv1.Job{}))
	})
}

func TestPodMatchesSession(t *testing.T) {
	bob := NewImpersonation("bob@acme.com", []string{"devs"})
	podFor := func(impersonation *Impersonation) *corev1.Pod {
		return genWebTerminalPod("webterminal-abc", "abc", testAPIServerURL, nil, impersonation, "")
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

func TestServiceAccountModeRefusal(t *testing.T) {
	yes, no := true, false
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
	clusterWithOwnAuthentication := clusterInDC(func(c *kubermaticv1.Cluster) { c.Spec.AuthenticationConfiguration = authConfig })

	testcases := []struct {
		name                    string
		cluster                 *kubermaticv1.Cluster
		seed                    *kubermaticv1.Seed
		noDefaultAuthentication bool
		emailVerified           *bool
		expected                TerminalConnStatus
	}{
		{name: "default authentication, token without the email_verified claim", cluster: clusterInDC(nil), seed: seedWith(nil)},
		{name: "default authentication, verified email", cluster: clusterInDC(nil), seed: seedWith(nil), emailVerified: &yes},
		{
			name:          "default authentication, unverified email",
			cluster:       clusterInDC(nil),
			seed:          seedWith(nil),
			emailVerified: &no,
			expected:      WebTerminalEmailNotVerified,
		},
		{
			name:                    "default authentication is not enabled",
			cluster:                 clusterInDC(nil),
			seed:                    seedWith(nil),
			noDefaultAuthentication: true,
			expected:                WebTerminalAuthenticationDisabled,
		},
		{
			name:     "cluster with its own AuthenticationConfiguration",
			cluster:  clusterWithOwnAuthentication,
			seed:     seedWith(nil),
			expected: WebTerminalAuthenticationUnsupported,
		},
		{
			name: "cluster with spec.oidc",
			cluster: clusterInDC(func(c *kubermaticv1.Cluster) {
				c.Spec.OIDC = kubermaticv1.OIDCSettings{IssuerURL: "https://idp.example.com", ClientID: "client"} //nolint:staticcheck
			}),
			seed:     seedWith(nil),
			expected: WebTerminalAuthenticationUnsupported,
		},
		{
			name:     "seed with an AuthenticationConfiguration",
			cluster:  clusterInDC(nil),
			seed:     seedWith(func(s *kubermaticv1.Seed) { s.Spec.AuthenticationConfiguration = authConfig }),
			expected: WebTerminalAuthenticationUnsupported,
		},
		{
			name:    "seed with its own OIDC provider",
			cluster: clusterInDC(nil),
			seed: seedWith(func(s *kubermaticv1.Seed) {
				s.Spec.OIDCProviderConfiguration = &kubermaticv1.OIDCProviderConfiguration{}
			}),
			expected: WebTerminalAuthenticationUnsupported,
		},
		{
			name:    "datacenter of the cluster with an AuthenticationConfiguration",
			cluster: clusterInDC(nil),
			seed: seedWith(func(s *kubermaticv1.Seed) {
				s.Spec.Datacenters["dc1"] = kubermaticv1.Datacenter{Spec: kubermaticv1.DatacenterSpec{AuthenticationConfiguration: authConfig}}
			}),
			expected: WebTerminalAuthenticationUnsupported,
		},
		{
			name:    "another datacenter with an AuthenticationConfiguration",
			cluster: clusterInDC(nil),
			seed: seedWith(func(s *kubermaticv1.Seed) {
				s.Spec.Datacenters["dc2"] = kubermaticv1.Datacenter{Spec: kubermaticv1.DatacenterSpec{AuthenticationConfiguration: authConfig}}
			}),
		},
		{
			// enabling the feature gate would not make the web terminal available for this cluster
			name:                    "cluster with its own AuthenticationConfiguration, default authentication is not enabled",
			cluster:                 clusterWithOwnAuthentication,
			seed:                    seedWith(nil),
			noDefaultAuthentication: true,
			expected:                WebTerminalAuthenticationUnsupported,
		},
		{
			// the cluster does not apply KKP's rule for the email, so the rule is not the reason
			name:          "cluster with its own AuthenticationConfiguration, unverified email",
			cluster:       clusterWithOwnAuthentication,
			seed:          seedWith(nil),
			emailVerified: &no,
			expected:      WebTerminalAuthenticationUnsupported,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			status, reason := ServiceAccountModeRefusal(tc.cluster, tc.seed, !tc.noDefaultAuthentication, tc.emailVerified)
			assert.Equal(t, tc.expected, status, "reason: %q", reason)
			// every refusal has a reason for the log
			assert.Equal(t, tc.expected == "", reason == "")
		})
	}
}

// TestWebTerminalCleanupJobDeletesServiceAccountObjects checks that the cleanup Job removes
// the objects of both modes, because a Job can outlive a switch of the mode.
func TestWebTerminalCleanupJobDeletesServiceAccountObjects(t *testing.T) {
	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	name := userAppName(userEmailID)
	job := genWebTerminalCleanupJob(name, userEmailID, "abcd1234", "")
	script := job.Spec.Template.Spec.Containers[0].Args[0]

	for _, deletion := range []string{
		"kubectl delete clusterrolebinding $USER_APP_NAME --ignore-not-found",
		"kubectl delete clusterrole $USER_APP_NAME --ignore-not-found",
		"kubectl delete serviceaccount $USER_APP_NAME -n $NAMESPACE_SYSTEM --ignore-not-found",
		"kubectl delete secret $KUBECONFIG_SECRET_NAME -n $NAMESPACE_SYSTEM --ignore-not-found",
	} {
		assert.Contains(t, script, deletion)
	}

	// a new session waits until the pod of the Job of the previous session is gone
	require.NotNil(t, job.Spec.Template.Spec.TerminationGracePeriodSeconds)
	assert.Equal(t, int64(1), *job.Spec.Template.Spec.TerminationGracePeriodSeconds)
}

func hasVolume(pod *corev1.Pod, name string) bool {
	return slices.ContainsFunc(pod.Spec.Volumes, func(v corev1.Volume) bool { return v.Name == name })
}

func hasMount(container corev1.Container, name string) bool {
	return slices.ContainsFunc(container.VolumeMounts, func(m corev1.VolumeMount) bool { return m.Name == name })
}
