/*
Copyright 2021 The Kubermatic Kubernetes Platform contributors.

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

package kubernetes_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"

	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	"k8c.io/kubermatic/v2/pkg/test/fake"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	restclient "k8s.io/client-go/rest"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	testAlertmanagerClusterName      = "test-alertmanager"
	testAlertmanagerNamespace        = "cluster-test-alertmanager"
	testAlertmanagerConfigSecretName = "test-secret"
)

func TestGetAlertmanager(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name                 string
		existingObjects      []ctrlruntimeclient.Object
		cluster              *kubermaticv1.Cluster
		expectedAlertmanager *kubermaticv1.Alertmanager
		expectedConfigSecret *corev1.Secret
		expectedError        string
	}{
		{
			name: "scenario 1, get alertmanager",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
				generateConfigSecret(testAlertmanagerConfigSecretName, testAlertmanagerNamespace, "1"),
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			expectedConfigSecret: generateConfigSecret(testAlertmanagerConfigSecretName, testAlertmanagerNamespace, "1"),
		},
		{
			name:          "scenario 2, alertmanager is not found",
			cluster:       genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedError: "alertmanagers.kubermatic.k8c.io \"alertmanager\" not found",
		},
		{
			name: "scenario 3, alertmanager config secret is not found",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			},
			cluster:       genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedError: "secrets \"test-secret\" not found",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			client := fake.NewClientBuilder().
				WithObjects(tc.existingObjects...).
				Build()
			fakeImpersonationClient := func(impCfg restclient.ImpersonationConfig) (ctrlruntimeclient.Client, error) {
				return client, nil
			}

			alertmanagerProvider := kubernetes.NewAlertmanagerProvider(fakeImpersonationClient, client)

			alertmanager, configSecret, err := alertmanagerProvider.Get(context.Background(), tc.cluster, genUserInfo())
			if len(tc.expectedError) == 0 {
				if err != nil {
					t.Fatal(err)
				}
				tc.expectedAlertmanager.TypeMeta = alertmanager.TypeMeta
				tc.expectedConfigSecret.TypeMeta = configSecret.TypeMeta
				assert.Equal(t, tc.expectedAlertmanager, alertmanager)
				assert.Equal(t, tc.expectedConfigSecret, configSecret)
			} else {
				if err == nil {
					t.Fatalf("expected error message")
				}
				assert.Equal(t, tc.expectedError, err.Error())
			}
		})
	}
}

func TestUpdateAlertmanager(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name                 string
		existingObjects      []ctrlruntimeclient.Object
		userInfo             *provider.UserInfo
		cluster              *kubermaticv1.Cluster
		expectedAlertmanager *kubermaticv1.Alertmanager
		expectedConfigSecret *corev1.Secret
		expectedError        string
	}{
		{
			name: "scenario 1, update config secret",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:            testAlertmanagerConfigSecretName,
						Namespace:       testAlertmanagerNamespace,
						ResourceVersion: "1",
					},
					Data: map[string][]byte{
						resources.AlertmanagerConfigSecretKey: []byte("test"),
					},
				},
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			expectedConfigSecret: generateConfigSecret(testAlertmanagerConfigSecretName, testAlertmanagerNamespace, "2"),
		},
		{
			name:                 "scenario 2, alertmanager is not found",
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, "", "1"),
			expectedError:        "failed to get alertmanager: alertmanagers.kubermatic.k8c.io \"alertmanager\" not found",
		},
		{
			name: "scenario 3, config secret is not set in alertmanager",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, "", "1"),
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, "", "1"),
			expectedError:        "failed to find alertmanager configuration",
		},
		{
			name: "scenario 4, config secret is not found",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			expectedError:        "failed to get config secret: secrets \"test-secret\" not found",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			client := fake.NewClientBuilder().
				WithObjects(tc.existingObjects...).
				Build()
			fakeImpersonationClient := func(impCfg restclient.ImpersonationConfig) (ctrlruntimeclient.Client, error) {
				return client, nil
			}

			alertmanagerProvider := kubernetes.NewAlertmanagerProvider(fakeImpersonationClient, client)

			alertmanager, configSecret, err := alertmanagerProvider.Update(context.Background(), tc.expectedAlertmanager,
				tc.expectedConfigSecret, genUserInfo())
			if len(tc.expectedError) == 0 {
				if err != nil {
					t.Fatal(err)
				}
				tc.expectedAlertmanager.TypeMeta = alertmanager.TypeMeta
				tc.expectedConfigSecret.TypeMeta = configSecret.TypeMeta
				assert.Equal(t, tc.expectedAlertmanager, alertmanager)
				assert.Equal(t, tc.expectedConfigSecret, configSecret)
			} else {
				if err == nil {
					t.Fatalf("expected error message")
				}
				assert.Equal(t, tc.expectedError, err.Error())
			}
		})
	}
}

func TestResetAlertmanager(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name                 string
		existingObjects      []ctrlruntimeclient.Object
		cluster              *kubermaticv1.Cluster
		expectedAlertmanager *kubermaticv1.Alertmanager
		expectedConfigSecret *corev1.Secret
		expectedError        string
	}{
		{
			name: "scenario 1, reset alertmanager will only delete the config secret",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
				generateConfigSecret(testAlertmanagerConfigSecretName, testAlertmanagerNamespace, "1"),
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			expectedConfigSecret: nil,
		},
		{
			name:                 "scenario 2, alertmanager is not found",
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, "", "1"),
			expectedError:        "failed to get alertmanager: alertmanagers.kubermatic.k8c.io \"alertmanager\" not found",
		},
		{
			name: "scenario 3, config secret is not set in alertmanager",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, "", "1"),
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, "", "1"),
			expectedError:        "failed to find alertmanager configuration",
		},
		{
			name: "scenario 4, config secret is not found",
			existingObjects: []ctrlruntimeclient.Object{
				generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			},
			cluster:              genCluster(testAlertmanagerClusterName, "kubernetes", "my-first-project-ID", "test-alertmanager", "john@acme.com"),
			expectedAlertmanager: generateAlertmanager(testAlertmanagerNamespace, testAlertmanagerConfigSecretName, "1"),
			expectedError:        "secrets \"test-secret\" not found",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			client := fake.NewClientBuilder().
				WithObjects(tc.existingObjects...).
				Build()
			fakeImpersonationClient := func(impCfg restclient.ImpersonationConfig) (ctrlruntimeclient.Client, error) {
				return client, nil
			}

			alertmanagerProvider := kubernetes.NewAlertmanagerProvider(fakeImpersonationClient, client)

			err := alertmanagerProvider.Reset(context.Background(), tc.cluster, genUserInfo())
			if len(tc.expectedError) == 0 {
				if err != nil {
					t.Fatal(err)
				}
				ctx := context.Background()
				alertmanager := &kubermaticv1.Alertmanager{}
				if err := client.Get(ctx, types.NamespacedName{
					Name:      tc.expectedAlertmanager.Name,
					Namespace: tc.expectedAlertmanager.Namespace,
				}, alertmanager); err != nil {
					t.Fatal(err)
				}
				tc.expectedAlertmanager.TypeMeta = alertmanager.TypeMeta
				configSecret := &corev1.Secret{}
				err = client.Get(ctx, types.NamespacedName{
					Name:      alertmanager.Spec.ConfigSecret.Name,
					Namespace: alertmanager.Namespace,
				}, configSecret)
				assert.True(t, apierrors.IsNotFound(err))
				assert.Equal(t, tc.expectedAlertmanager, alertmanager)
			} else {
				if err == nil {
					t.Fatalf("expected error message")
				}
				assert.Equal(t, tc.expectedError, err.Error())
			}
		})
	}
}

func generateAlertmanager(namespace, configSecretName, resourceVersion string) *kubermaticv1.Alertmanager {
	return &kubermaticv1.Alertmanager{
		ObjectMeta: metav1.ObjectMeta{
			Name:            resources.AlertmanagerName,
			Namespace:       namespace,
			ResourceVersion: resourceVersion,
		},
		Spec: kubermaticv1.AlertmanagerSpec{
			ConfigSecret: corev1.LocalObjectReference{
				Name: configSecretName,
			},
		},
	}
}

func generateConfigSecret(name, namespace, resourceVersion string) *corev1.Secret {
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:            name,
			Namespace:       namespace,
			ResourceVersion: resourceVersion,
		},
		Data: map[string][]byte{
			resources.AlertmanagerConfigSecretKey: []byte(generateAlertmanagerConfig(name)),
		},
	}
}

func generateAlertmanagerConfig(name string) string {
	return fmt.Sprintf(`
alertmanager_config: |
  global:
    smtp_smarthost: 'localhost:25'
    smtp_from: '%s@example.org'
  route:
    receiver: "test"
  receivers:
    - name: "test"
      email_configs:
      - to: '%s@example.org'
`, name, name)
}

func genUserInfo() *provider.UserInfo {
	return &provider.UserInfo{Email: "john@acme.com", Groups: []string{"owners-abcd"}}
}
