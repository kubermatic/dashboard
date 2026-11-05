/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

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

package cluster_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestBindUserToRole(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		body                   string
		roleName               string
		namespace              string
		expectedResponse       string
		httpStatus             int
		clusterToGet           string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		// scenario 1
		{
			name:             "scenario 1: bind user to role test-1",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","apiGroup":"rbac.authorization.k8s.io","name":"test@example.com"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-1", "test"),
				test.GenDefaultClusterRole("role-1"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 2: create role binding when cluster role doesn't exist",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"error":{"code":404,"message":"roles.rbac.authorization.k8s.io \"role-1\" not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusNotFound,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// scenario 3
		{
			name:             "scenario 3: update existing binding for the new user",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"User","apiGroup":"rbac.authorization.k8s.io","name":"test@example.com"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 4: bind existing user",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"error":{"code":400,"message":"user bob@acme.com already connected to role role-1"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusBadRequest,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// group scenarios
		{
			name:             "scenario 5: bind group to role test-1",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"group":"test"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"test"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-1", "test"),
				test.GenDefaultClusterRole("role-1"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 6: create role binding when cluster role doesn't exist",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"group":"test"}`,
			expectedResponse: `{"error":{"code":404,"message":"roles.rbac.authorization.k8s.io \"role-1\" not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusNotFound,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// scenario 7
		{
			name:             "scenario 7: update existing binding for the new group",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"group":"test"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"Group","name":"admins"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"test"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultGroupRoleBinding("test", "default", "role-1", "admins"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 8: update existing binding for the new group",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"group":"test"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"test"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 9: bind existing group",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"group":"test"}`,
			expectedResponse: `{"error":{"code":400,"message":"group test already connected to role role-1"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusBadRequest,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultGroupRoleBinding("test", "default", "role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// service account tests
		{
			name:             "scenario 10: bind service account to role test-1",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace":"default"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-1", "test"),
				test.GenDefaultClusterRole("role-1"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 11: create role binding when cluster role doesn't exist",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace":"default"}`,
			expectedResponse: `{"error":{"code":404,"message":"roles.rbac.authorization.k8s.io \"role-1\" not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusNotFound,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 12: update existing binding for the new service account",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test-2", "serviceAccountNamespace":"kube-system"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"},{"kind":"ServiceAccount","name":"test-2","namespace":"kube-system"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenServiceAccountRoleBinding("test", "default", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 13: update existing binding for the new service account",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace":"default"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 14: bind existing service account",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace":"default"}`,
			expectedResponse: `{"error":{"code":400,"message":"service account default/test already connected to the role role-1"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusBadRequest,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenServiceAccountRoleBinding("test", "default", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},

		{
			name:             "scenario 10: the admin John can bind user to role test-1 for any cluster",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","apiGroup":"rbac.authorization.k8s.io","name":"test@example.com"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", true),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-1", "test"),
				test.GenDefaultClusterRole("role-1"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
		{
			name:             "scenario 11: the user John can not bind user to role test-1 for Bob's cluster",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"error":{"code":403,"message":"forbidden: \"john@acme.com\" doesn't belong to project my-first-project-ID"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", false),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-1", "test"),
				test.GenDefaultClusterRole("role-1"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			kubeObj = append(kubeObj, tc.existingKubernetesObjs...)
			req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/roles/%s/%s/bindings", test.ProjectName, tc.clusterToGet, tc.namespace, tc.roleName), strings.NewReader(tc.body))
			res := httptest.NewRecorder()
			var kubermaticObj []ctrlruntimeclient.Object
			kubermaticObj = append(kubermaticObj, tc.existingKubermaticObjs...)
			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.existingAPIUser, nil, kubeObj, kubernetesObj, kubermaticObj, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}

			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestUnbindUserFromRoleBinding(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		body                   string
		roleName               string
		namespace              string
		expectedResponse       string
		httpStatus             int
		clusterToGet           string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		{
			name:             "scenario 1: remove user from the binding",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"namespace":"default","roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 2: remove group from the binding",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"group":"test"}`,
			expectedResponse: `{"namespace":"default","roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultGroupRoleBinding("test", "default", "role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 3: remove service account from the binding",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace":"default"}`,
			expectedResponse: `{"namespace":"default","roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenServiceAccountRoleBinding("test", "default", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 4: remove service account from another namespace from existing the binding",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace":"another-ns"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenServiceAccountRoleBinding("test", "default", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}, {Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "another-ns"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},

		{
			name:             "scenario 5: the admin John can remove user from the binding for the any cluster",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"namespace":"default","roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", true),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
		{
			name:             "scenario 6: the user John can not remove user from the binding for the Bob's cluster",
			roleName:         "role-1",
			namespace:        "default",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"error":{"code":403,"message":"forbidden: \"john@acme.com\" doesn't belong to project my-first-project-ID"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", false),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			kubeObj = append(kubeObj, tc.existingKubernetesObjs...)
			req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/roles/%s/%s/bindings", test.ProjectName, tc.clusterToGet, tc.namespace, tc.roleName), strings.NewReader(tc.body))
			res := httptest.NewRecorder()
			var kubermaticObj []ctrlruntimeclient.Object
			kubermaticObj = append(kubermaticObj, tc.existingKubermaticObjs...)
			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.existingAPIUser, nil, kubeObj, kubernetesObj, kubermaticObj, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}

			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestBindUserToClusterRole(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		body                   string
		roleName               string
		expectedResponse       string
		httpStatus             int
		clusterToGet           string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		// scenario 1
		{
			name:             "scenario 1: bind user to role-1, when cluster role binding doesn't exist",
			roleName:         "role-1",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"error":{"code":500,"message":"the cluster role binding not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusInternalServerError,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 2: create cluster role binding when cluster role doesn't exist",
			roleName:         "role-1",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"error":{"code":404,"message":"clusterroles.rbac.authorization.k8s.io \"role-1\" not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusNotFound,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-2"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// scenario 3
		{
			name:             "scenario 3: update existing binding for the new user",
			roleName:         "role-1",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"User","apiGroup":"rbac.authorization.k8s.io","name":"test@example.com"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 4: bind existing user",
			roleName:         "role-1",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"error":{"code":400,"message":"user test@example.com already connected to the cluster role role-1"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusBadRequest,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "test@example.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// group scenarios
		// scenario 4
		{
			name:             "scenario 5: bind group to role-1, when cluster role binding doesn't exist",
			roleName:         "role-1",
			body:             `{"group":"test"}`,
			expectedResponse: `{"error":{"code":500,"message":"the cluster role binding not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusInternalServerError,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 6: create cluster role binding when cluster role doesn't exist",
			roleName:         "role-1",
			body:             `{"group":"test"}`,
			expectedResponse: `{"error":{"code":404,"message":"clusterroles.rbac.authorization.k8s.io \"role-1\" not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusNotFound,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-2"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// scenario 7
		{
			name:             "scenario 7: update existing binding for the new group",
			roleName:         "role-1",
			body:             `{"group":"test"}`,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"test"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 8: update existing binding for the new group",
			roleName:         "role-1",
			body:             `{"group":"test"}`,
			expectedResponse: `{"subjects":[{"kind":"Group","name":"admins"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"test"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultGroupClusterRoleBinding("test", "role-1", "admins"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 9: bind existing group",
			roleName:         "role-1",
			body:             `{"group":"test"}`,
			expectedResponse: `{"error":{"code":400,"message":"group test already connected to the cluster role role-1"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusBadRequest,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultGroupClusterRoleBinding("test", "role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},

		// service account scenarios

		{
			name:             "scenario 10: bind service account to role-1, when cluster role binding doesn't exist",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "default"}`,
			expectedResponse: `{"error":{"code":500,"message":"the cluster role binding not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusInternalServerError,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 11: create cluster role binding when cluster role doesn't exist",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "default"}`,
			expectedResponse: `{"error":{"code":404,"message":"clusterroles.rbac.authorization.k8s.io \"role-1\" not found"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusNotFound,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-2"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 12: update existing binding for the new service account",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "default"}`,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 13: update existing binding for the new service account",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "default"}`,
			expectedResponse: `{"subjects":[{"kind":"Group","name":"admins"},{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultGroupClusterRoleBinding("test", "role-1", "admins"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 14: update existing binding for the new service account in different namespace",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "another-ns"}`,
			expectedResponse: `{"subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"},{"kind":"ServiceAccount","name":"test","namespace":"another-ns"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenServiceAccountClusterRoleBinding("test", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 15: bind existing serviceAccount",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "default"}`,
			expectedResponse: `{"error":{"code":400,"message":"service account default/test already connected to the cluster role role-1"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusBadRequest,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenServiceAccountClusterRoleBinding("test", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},

		{
			name:             "scenario 16: admin can update existing binding for the new user for any cluster",
			roleName:         "role-1",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"User","apiGroup":"rbac.authorization.k8s.io","name":"test@example.com"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", true),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
		{
			name:             "scenario 17: user John can not update existing binding for the new user for Bob's cluster",
			roleName:         "role-1",
			body:             `{"userEmail":"test@example.com"}`,
			expectedResponse: `{"error":{"code":403,"message":"forbidden: \"john@acme.com\" doesn't belong to project my-first-project-ID"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", false),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			var kubermaticObj []ctrlruntimeclient.Object
			kubeObj = append(kubeObj, tc.existingKubernetesObjs...)
			req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/clusterroles/%s/clusterbindings", test.ProjectName, tc.clusterToGet, tc.roleName), strings.NewReader(tc.body))
			res := httptest.NewRecorder()

			kubermaticObj = append(kubermaticObj, tc.existingKubermaticObjs...)
			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.existingAPIUser, nil, kubeObj, kubernetesObj, kubermaticObj, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}
			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestUnbindUserFromClusterRoleBinding(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		body                   string
		roleName               string
		expectedResponse       string
		httpStatus             int
		clusterToGet           string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		// scenario 1
		{
			name:             "scenario 1: remove user from existing cluster role binding",
			roleName:         "role-1",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// scenario 2
		{
			name:             "scenario 2: remove group from existing cluster role binding",
			roleName:         "role-1",
			body:             `{"group":"test"}`,
			expectedResponse: `{"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultGroupClusterRoleBinding("test", "role-1", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 3: remove service account from existing cluster role binding",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "default"}`,
			expectedResponse: `{"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenServiceAccountClusterRoleBinding("test", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 4: remove service account from another namespace from existing cluster role binding",
			roleName:         "role-1",
			body:             `{"serviceAccount":"test", "serviceAccountNamespace": "another-ns"}`,
			expectedResponse: `{"subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenServiceAccountClusterRoleBinding("test", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}, {Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "another-ns"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 5: the admin can remove user from existing cluster role binding for any cluster",
			roleName:         "role-1",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"roleRefName":"role-1"}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", true),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
		{
			name:             "scenario 6: the user can not remove user from existing cluster role binding for Bob's cluster",
			roleName:         "role-1",
			body:             `{"userEmail":"bob@acme.com"}`,
			expectedResponse: `{"error":{"code":403,"message":"forbidden: \"john@acme.com\" doesn't belong to project my-first-project-ID"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", false),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			var kubermaticObj []ctrlruntimeclient.Object
			kubeObj = append(kubeObj, tc.existingKubernetesObjs...)
			req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/clusterroles/%s/clusterbindings", test.ProjectName, tc.clusterToGet, tc.roleName), strings.NewReader(tc.body))
			res := httptest.NewRecorder()

			kubermaticObj = append(kubermaticObj, tc.existingKubermaticObjs...)
			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.existingAPIUser, nil, kubeObj, kubernetesObj, kubermaticObj, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}
			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func genOIDCKubermaticConfiguration(openIDAuthPlugin bool) *kubermaticv1.KubermaticConfiguration {
	return &kubermaticv1.KubermaticConfiguration{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "kubermatic",
			Namespace: resources.KubermaticNamespace,
		},
		Spec: kubermaticv1.KubermaticConfigurationSpec{
			Versions: kubermaticv1.KubermaticVersioningConfiguration{
				Versions: test.GenDefaultVersions(),
			},
			FeatureGates: map[string]bool{
				features.OpenIDAuthPlugin: openIDAuthPlugin,
			},
		},
	}
}

func TestBindOIDCGroupToClusterRole(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		method                 string
		body                   string
		openIDAuthPlugin       bool
		expectedResponse       string
		httpStatus             int
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		{
			name:             "scenario 1: OIDC group gets the oidc: prefix",
			method:           http.MethodPost,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			openIDAuthPlugin: true,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"oidc:kubermatic:sig-api-ui"}],"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 2: group without oidcGroup is stored verbatim",
			method:           http.MethodPost,
			body:             `{"group":"system:serviceaccounts:my-ns"}`,
			openIDAuthPlugin: true,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"system:serviceaccounts:my-ns"}],"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 3: an already prefixed OIDC group is not prefixed twice",
			method:           http.MethodPost,
			body:             `{"group":"oidc:kubermatic:sig-api-ui","oidcGroup":true}`,
			openIDAuthPlugin: true,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"oidc:kubermatic:sig-api-ui"}],"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 4: OIDC group is stored verbatim when the cluster has no groups prefix",
			method:           http.MethodPost,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			openIDAuthPlugin: false,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"kubermatic:sig-api-ui"}],"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 5: duplicate check uses the prefixed name",
			method:           http.MethodPost,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			openIDAuthPlugin: true,
			expectedResponse: `{"error":{"code":400,"message":"group oidc:kubermatic:sig-api-ui already connected to the cluster role role-1"}}`,
			httpStatus:       http.StatusBadRequest,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultGroupClusterRoleBinding("test", "role-1", "oidc:kubermatic:sig-api-ui"),
			},
		},
		{
			name:             "scenario 6: oidcGroup without group is rejected",
			method:           http.MethodPost,
			body:             `{"userEmail":"test@example.com","oidcGroup":true}`,
			openIDAuthPlugin: true,
			expectedResponse: `{"error":{"code":400,"message":"invalid request: oidcGroup can only be used in conjunction with group"}}`,
			httpStatus:       http.StatusBadRequest,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 7: unbind OIDC group by its unprefixed name",
			method:           http.MethodDelete,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			openIDAuthPlugin: true,
			expectedResponse: `{"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultGroupClusterRoleBinding("test", "role-1", "oidc:kubermatic:sig-api-ui"),
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			kubeObj := append([]ctrlruntimeclient.Object{test.GenDefaultClusterRole("role-1")}, tc.existingKubernetesObjs...)
			kubermaticObj := test.GenDefaultKubermaticObjects(test.GenTestSeed(), test.GenDefaultCluster())
			req := httptest.NewRequest(tc.method, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/clusterroles/%s/clusterbindings", test.ProjectName, test.GenDefaultCluster().Name, "role-1"), strings.NewReader(tc.body))
			res := httptest.NewRecorder()

			ep, _, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, kubeObj, nil, kubermaticObj, genOIDCKubermaticConfiguration(tc.openIDAuthPlugin), hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}
			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestBindOIDCGroupToRole(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		method                 string
		body                   string
		expectedResponse       string
		httpStatus             int
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		{
			name:             "scenario 1: OIDC group gets the oidc: prefix",
			method:           http.MethodPost,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"oidc:kubermatic:sig-api-ui"}],"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 2: group without oidcGroup is stored verbatim",
			method:           http.MethodPost,
			body:             `{"group":"system:serviceaccounts:my-ns"}`,
			expectedResponse: `{"namespace":"default","subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"system:serviceaccounts:my-ns"}],"roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRoleBinding("test", "default", "role-1", "bob@acme.com"),
			},
		},
		{
			name:             "scenario 3: duplicate check uses the prefixed name",
			method:           http.MethodPost,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			expectedResponse: `{"error":{"code":400,"message":"group oidc:kubermatic:sig-api-ui already connected to role role-1"}}`,
			httpStatus:       http.StatusBadRequest,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultGroupRoleBinding("test", "default", "role-1", "oidc:kubermatic:sig-api-ui"),
			},
		},
		{
			name:             "scenario 4: unbind OIDC group by its unprefixed name",
			method:           http.MethodDelete,
			body:             `{"group":"kubermatic:sig-api-ui","oidcGroup":true}`,
			expectedResponse: `{"namespace":"default","roleRefName":"role-1"}`,
			httpStatus:       http.StatusOK,
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultGroupRoleBinding("test", "default", "role-1", "oidc:kubermatic:sig-api-ui"),
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			kubeObj := append([]ctrlruntimeclient.Object{test.GenDefaultRole("role-1", "default")}, tc.existingKubernetesObjs...)
			kubermaticObj := test.GenDefaultKubermaticObjects(test.GenTestSeed(), test.GenDefaultCluster())
			req := httptest.NewRequest(tc.method, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/roles/%s/%s/bindings", test.ProjectName, test.GenDefaultCluster().Name, "default", "role-1"), strings.NewReader(tc.body))
			res := httptest.NewRecorder()

			ep, _, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, kubeObj, nil, kubermaticObj, genOIDCKubermaticConfiguration(true), hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}
			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func genAuthenticationConfigurationSecret(name, key, authConfig string) *corev1.Secret {
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: test.GenDefaultCluster().Status.NamespaceName,
		},
		Data: map[string][]byte{key: []byte(authConfig)},
	}
}

func TestBindOIDCGroupWithAuthenticationConfiguration(t *testing.T) {
	t.Parallel()

	clusterWithCustomAuthConfig := test.GenDefaultCluster()
	clusterWithCustomAuthConfig.Spec.AuthenticationConfiguration = &kubermaticv1.AuthenticationConfiguration{SecretName: "custom-auth", SecretKey: "config.yaml"}

	testcases := []struct {
		name             string
		cluster          *kubermaticv1.Cluster
		secret           *corev1.Secret
		httpStatus       int
		expectedResponse string
	}{
		{
			name:    "scenario 1: prefix of the issuer's authenticator in the generated configuration",
			cluster: test.GenDefaultCluster(),
			secret: genAuthenticationConfigurationSecret(resources.ApiserverAuthenticationConfigurationSecretName, resources.AuthenticationConfigurationKey, fmt.Sprintf(`
jwt:
- issuer: {url: https://other.example.com}
  claimMappings:
    groups: {claim: groups, prefix: "other:"}
- issuer: {url: %s}
  claimMappings:
    groups: {claim: groups, prefix: "corp:"}
`, test.IssuerURL)),
			httpStatus:       http.StatusOK,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"corp:kubermatic:sig-api-ui"}],"roleRefName":"role-1"}`,
		},
		{
			name:    "scenario 2: prefix from the Secret referenced by the cluster",
			cluster: clusterWithCustomAuthConfig,
			secret: genAuthenticationConfigurationSecret("custom-auth", "config.yaml", `
jwt:
- issuer: {url: https://idp.example.com}
  claimMappings:
    groups: {claim: groups, prefix: "custom:"}
`),
			httpStatus:       http.StatusOK,
			expectedResponse: `{"subjects":[{"kind":"User","name":"bob@acme.com"},{"kind":"Group","apiGroup":"rbac.authorization.k8s.io","name":"custom:kubermatic:sig-api-ui"}],"roleRefName":"role-1"}`,
		},
		{
			name:    "scenario 3: rejected when no authenticator matches the issuer",
			cluster: test.GenDefaultCluster(),
			secret: genAuthenticationConfigurationSecret(resources.ApiserverAuthenticationConfigurationSecretName, resources.AuthenticationConfigurationKey, `
jwt:
- issuer: {url: https://a.example.com}
  claimMappings:
    groups: {claim: groups, prefix: "a:"}
- issuer: {url: https://b.example.com}
  claimMappings:
    groups: {claim: groups, prefix: "b:"}
`),
			httpStatus:       http.StatusBadRequest,
			expectedResponse: `{"error":{"code":400,"message":"cannot determine the OIDC groups prefix of the cluster: none of the JWT authenticators matches the OIDC issuer \"url://dex\"; set the group name as the kube-apiserver sees it and disable the OIDC group option"}}`,
		},
		{
			name:    "scenario 4: rejected when the groups are mapped with a CEL expression",
			cluster: test.GenDefaultCluster(),
			secret: genAuthenticationConfigurationSecret(resources.ApiserverAuthenticationConfigurationSecretName, resources.AuthenticationConfigurationKey, `
jwt:
- issuer: {url: https://idp.example.com}
  claimMappings:
    groups: {expression: 'claims.groups.map(g, "corp:" + g)'}
`),
			httpStatus:       http.StatusBadRequest,
			expectedResponse: `{"error":{"code":400,"message":"cannot determine the OIDC groups prefix of the cluster: the groups of the JWT authenticator for \"https://idp.example.com\" are mapped with a CEL expression; set the group name as the kube-apiserver sees it and disable the OIDC group option"}}`,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			kubeObj := []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRoleBinding("test", "role-1", "bob@acme.com"),
			}
			kubermaticObj := append(test.GenDefaultKubermaticObjects(test.GenTestSeed(), tc.cluster), tc.secret)
			req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/clusterroles/%s/clusterbindings", test.ProjectName, tc.cluster.Name, "role-1"), strings.NewReader(`{"group":"kubermatic:sig-api-ui","oidcGroup":true}`))
			res := httptest.NewRecorder()

			// The spec-based fallback would add "oidc:"; the Secret must win.
			ep, _, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, kubeObj, nil, kubermaticObj, genOIDCKubermaticConfiguration(true), hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}
			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestListRoleBinding(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		expectedResponse       string
		httpStatus             int
		clusterToGet           string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		{
			name:             "scenario 1: list bindings",
			expectedResponse: `[{"namespace":"default","subjects":[{"kind":"User","name":"test-1@example.com"}],"roleRefName":"role-1"},{"namespace":"default","subjects":[{"kind":"User","name":"test-2@example.com"}],"roleRefName":"role-2"},{"namespace":"default","subjects":[{"kind":"Group","name":"test"}],"roleRefName":"role-2"},{"namespace":"default","subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-1"},{"namespace":"default","subjects":[{"kind":"ServiceAccount","name":"test","namespace":"test"}],"roleRefName":"role-1"},{"namespace":"test","subjects":[{"kind":"User","name":"test-10@example.com"}],"roleRefName":"role-10"},{"namespace":"test","subjects":[{"kind":"Group","name":"test"}],"roleRefName":"role-10"}]`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-2", "default"),
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultRoleBinding("binding-1", "default", "role-1", "test-1@example.com"),
				test.GenDefaultRoleBinding("binding-2", "default", "role-2", "test-2@example.com"),
				test.GenDefaultGroupRoleBinding("binding-3", "default", "role-2", "test"),
				test.GenServiceAccountRoleBinding("binding-4", "default", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
				test.GenServiceAccountRoleBinding("binding-5", "default", "role-1", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "test"}}),
				test.GenDefaultRoleBinding("binding-1", "test", "role-10", "test-10@example.com"),
				test.GenDefaultGroupRoleBinding("binding-2", "test", "role-10", "test"),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		{
			name:             "scenario 2: the admin John can list bindings for any cluster",
			expectedResponse: `[{"namespace":"default","subjects":[{"kind":"User","name":"test-1@example.com"}],"roleRefName":"role-1"},{"namespace":"default","subjects":[{"kind":"User","name":"test-2@example.com"}],"roleRefName":"role-2"},{"namespace":"default","subjects":[{"kind":"Group","name":"test"}],"roleRefName":"role-2"},{"namespace":"test","subjects":[{"kind":"User","name":"test-10@example.com"}],"roleRefName":"role-10"},{"namespace":"test","subjects":[{"kind":"Group","name":"test"}],"roleRefName":"role-10"}]`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", true),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-2", "default"),
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultRoleBinding("binding-1", "default", "role-1", "test-1@example.com"),
				test.GenDefaultRoleBinding("binding-2", "default", "role-2", "test-2@example.com"),
				test.GenDefaultGroupRoleBinding("binding-3", "default", "role-2", "test"),
				test.GenDefaultRoleBinding("binding-1", "test", "role-10", "test-10@example.com"),
				test.GenDefaultGroupRoleBinding("binding-2", "test", "role-10", "test"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
		{
			name:             "scenario 3: the user John can not list Bob's bindings",
			expectedResponse: `{"error":{"code":403,"message":"forbidden: \"john@acme.com\" doesn't belong to project my-first-project-ID"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", false),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultRole("role-1", "default"),
				test.GenDefaultRole("role-2", "default"),
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultRoleBinding("binding-1", "default", "role-1", "test-1@example.com"),
				test.GenDefaultRoleBinding("binding-2", "default", "role-2", "test-2@example.com"),
				test.GenDefaultGroupRoleBinding("binding-3", "default", "role-2", "test"),
				test.GenDefaultRoleBinding("binding-1", "test", "role-10", "test-10@example.com"),
				test.GenDefaultGroupRoleBinding("binding-2", "test", "role-10", "test"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			var kubermaticObj []ctrlruntimeclient.Object
			kubeObj = append(kubeObj, tc.existingKubernetesObjs...)
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/bindings", test.ProjectName, tc.clusterToGet), strings.NewReader(""))
			res := httptest.NewRecorder()

			kubermaticObj = append(kubermaticObj, tc.existingKubermaticObjs...)
			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.existingAPIUser, nil, kubeObj, kubernetesObj, kubermaticObj, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}

			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestListClusterRoleBinding(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		expectedResponse       string
		httpStatus             int
		clusterToGet           string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		existingKubernetesObjs []ctrlruntimeclient.Object
	}{
		// scenario 1
		{
			name:             "scenario 1: list cluster role bindings",
			expectedResponse: ` [{"subjects":[{"kind":"User","name":"test-1"}],"roleRefName":"role-1"},{"subjects":[{"kind":"User","name":"test-2"}],"roleRefName":"role-1"},{"subjects":[{"kind":"User","name":"test-3"}],"roleRefName":"role-2"},{"subjects":[{"kind":"Group","name":"test-4"}],"roleRefName":"role-2"},{"subjects":[{"kind":"ServiceAccount","name":"test","namespace":"default"}],"roleRefName":"role-2"}]`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("binding-1-1", "role-1", "test-1"),
				test.GenDefaultClusterRoleBinding("binding-1-2", "role-1", "test-2"),
				test.GenDefaultClusterRoleBinding("binding-2-1", "role-2", "test-3"),
				test.GenDefaultGroupClusterRoleBinding("binding-2-2", "role-2", "test-4"),
				test.GenServiceAccountClusterRoleBinding("binding-2-3", "role-2", []rbacv1.Subject{{Kind: rbacv1.ServiceAccountKind, Name: "test", Namespace: "default"}}),
			},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
		// scenario 2
		{
			name:             "scenario 2: the admin John can list cluster role bindings for any cluster",
			expectedResponse: `[{"subjects":[{"kind":"User","name":"test-1"}],"roleRefName":"role-1"},{"subjects":[{"kind":"User","name":"test-2"}],"roleRefName":"role-1"},{"subjects":[{"kind":"User","name":"test-3"}],"roleRefName":"role-2"},{"subjects":[{"kind":"Group","name":"test-4"}],"roleRefName":"role-2"}]`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", true),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("binding-1-1", "role-1", "test-1"),
				test.GenDefaultClusterRoleBinding("binding-1-2", "role-1", "test-2"),
				test.GenDefaultClusterRoleBinding("binding-2-1", "role-2", "test-3"),
				test.GenDefaultGroupClusterRoleBinding("binding-2-2", "role-2", "test-4"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
		// scenario 3
		{
			name:             "scenario 3: the user John can not list Bob's cluster role bindings",
			expectedResponse: `{"error":{"code":403,"message":"forbidden: \"john@acme.com\" doesn't belong to project my-first-project-ID"}}`,
			clusterToGet:     test.GenDefaultCluster().Name,
			httpStatus:       http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genUser("John", "john@acme.com", false),
			),
			existingKubernetesObjs: []ctrlruntimeclient.Object{
				test.GenDefaultClusterRole("role-1"),
				test.GenDefaultClusterRole("role-2"),
				test.GenDefaultClusterRoleBinding("binding-1-1", "role-1", "test-1"),
				test.GenDefaultClusterRoleBinding("binding-1-2", "role-1", "test-2"),
				test.GenDefaultClusterRoleBinding("binding-2-1", "role-2", "test-3"),
				test.GenDefaultGroupClusterRoleBinding("binding-2-2", "role-2", "test-4"),
			},
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			var kubermaticObj []ctrlruntimeclient.Object
			kubeObj = append(kubeObj, tc.existingKubernetesObjs...)
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v2/projects/%s/clusters/%s/clusterbindings", test.ProjectName, tc.clusterToGet), strings.NewReader(""))
			res := httptest.NewRecorder()

			kubermaticObj = append(kubermaticObj, tc.existingKubermaticObjs...)
			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.existingAPIUser, nil, kubeObj, kubernetesObj, kubermaticObj, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}

			test.CompareWithResult(t, res, tc.expectedResponse)
		})
	}
}

func TestClusterRoleUserReqValidate(t *testing.T) {
	tests := []struct {
		name             string
		projectReq       common.ProjectReq
		body             apiv1.ClusterRoleUser
		expectedErrorMsg string
	}{
		{
			name:       "valid: userEmail",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.ClusterRoleUser{
				UserEmail: "test@example.com",
			},
			expectedErrorMsg: "",
		},
		{
			name:       "valid: group",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.ClusterRoleUser{
				Group: "someGroup",
			},
			expectedErrorMsg: "",
		},
		{
			name:       "valid: OIDC group",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.ClusterRoleUser{
				Group:     "someGroup",
				OIDCGroup: true,
			},
			expectedErrorMsg: "",
		},
		{
			name:       "invalid: oidcGroup can not be used with user email",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.ClusterRoleUser{
				UserEmail: "test@example.com",
				OIDCGroup: true,
			},
			expectedErrorMsg: "oidcGroup can only be used in conjunction with group",
		},
		{
			name:       "invalid: oidcGroup can not be used with service account",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.ClusterRoleUser{
				ServiceAccount:          "sa",
				ServiceAccountNamespace: "default",
				OIDCGroup:               true,
			},
			expectedErrorMsg: "oidcGroup can only be used in conjunction with group",
		},
		{
			name:       "valid: service account",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.ClusterRoleUser{
				ServiceAccount:          "sa",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "",
		},
		{
			name:       "invalid: projectId can not be empty",
			projectReq: common.ProjectReq{},
			body: apiv1.ClusterRoleUser{
				UserEmail: "test@example.com",
			},
			expectedErrorMsg: "the project ID cannot be empty",
		},
		{
			name:             "invalid:  all body can not be empty",
			projectReq:       common.ProjectReq{ProjectID: "project-id"},
			body:             apiv1.ClusterRoleUser{},
			expectedErrorMsg: "either user email or group or service account must be set",
		},
		{
			name:       "invalid: user email can not be used in conjunction with group",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				UserEmail: "test@example.com",
				Group:     "some-group",
			},
			expectedErrorMsg: "user email can not be used in conjunction with group or service account",
		},
		{
			name:       "invalid: user email can not be used in conjunction with service account",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				UserEmail:      "test@example.com",
				ServiceAccount: "sa",
			},
			expectedErrorMsg: "user email can not be used in conjunction with group or service account",
		},
		{
			name:       "invalid: user email can not be used in conjunction with service account namespace",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				UserEmail:               "test@example.com",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "user email can not be used in conjunction with group or service account",
		},
		{
			name:       "invalid: group can not be used in conjunction with service account",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				Group:          "some-group",
				ServiceAccount: "sa",
			},
			expectedErrorMsg: "group can not be used in conjunction with email or service account",
		},
		{
			name:       "invalid: user email can not be used in conjunction with service account namespace",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				Group:                   "some-group",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "group can not be used in conjunction with email or service account",
		},

		{
			name:       "invalid: both service account and service account namespace must be defined (sa namespace empty)",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				ServiceAccount:          "sa",
				ServiceAccountNamespace: "",
			},
			expectedErrorMsg: "both service account and service account namespace must be defined",
		},
		{
			name:       "invalid: both service account and service account namespace must be defined (sa empty)",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.ClusterRoleUser{
				ServiceAccount:          "",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "both service account and service account namespace must be defined",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := cluster.ClusterRoleUserReq{
				ProjectReq: tt.projectReq,
				Body:       tt.body,
			}

			err := req.Validate()

			if len(tt.expectedErrorMsg) > 0 {
				if err == nil {
					t.Fatalf("expect error '%s' but got nil", tt.expectedErrorMsg)
				}
				if tt.expectedErrorMsg != err.Error() {
					t.Errorf("expected error '%s' got '%s'", tt.expectedErrorMsg, err.Error())
				}
			} else if err != nil {
				t.Fatalf("expect no error but got error=%s", err)
			}
		})
	}
}

func TestRoleUserReqValidate(t *testing.T) {
	tests := []struct {
		name             string
		projectReq       common.ProjectReq
		body             apiv1.RoleUser
		expectedErrorMsg string
	}{
		{
			name:       "valid: userEmail",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.RoleUser{
				UserEmail: "test@example.com",
			},
			expectedErrorMsg: "",
		},
		{
			name:       "valid: group",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.RoleUser{
				Group: "someGroup",
			},
			expectedErrorMsg: "",
		},
		{
			name:       "valid: OIDC group",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.RoleUser{
				Group:     "someGroup",
				OIDCGroup: true,
			},
			expectedErrorMsg: "",
		},
		{
			name:       "invalid: oidcGroup can not be used with user email",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.RoleUser{
				UserEmail: "test@example.com",
				OIDCGroup: true,
			},
			expectedErrorMsg: "oidcGroup can only be used in conjunction with group",
		},
		{
			name:       "invalid: oidcGroup can not be used with service account",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.RoleUser{
				ServiceAccount:          "sa",
				ServiceAccountNamespace: "default",
				OIDCGroup:               true,
			},
			expectedErrorMsg: "oidcGroup can only be used in conjunction with group",
		},
		{
			name:       "valid: service account",
			projectReq: common.ProjectReq{ProjectID: "projectID"},
			body: apiv1.RoleUser{
				ServiceAccount:          "sa",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "",
		},
		{
			name:       "invalid: projectId can not be empty",
			projectReq: common.ProjectReq{},
			body: apiv1.RoleUser{
				UserEmail: "test@example.com",
			},
			expectedErrorMsg: "the project ID cannot be empty",
		},
		{
			name:             "invalid:  all body can not be empty",
			projectReq:       common.ProjectReq{ProjectID: "project-id"},
			body:             apiv1.RoleUser{},
			expectedErrorMsg: "either user email, group or service account must be set",
		},
		{
			name:       "invalid: user email can not be used in conjunction with group",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				UserEmail: "test@example.com",
				Group:     "some-group",
			},
			expectedErrorMsg: "user email can not be used in conjunction with group or service account",
		},
		{
			name:       "invalid: user email can not be used in conjunction with service account",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				UserEmail:      "test@example.com",
				ServiceAccount: "sa",
			},
			expectedErrorMsg: "user email can not be used in conjunction with group or service account",
		},
		{
			name:       "invalid: user email can not be used in conjunction with service account namespace",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				UserEmail:               "test@example.com",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "user email can not be used in conjunction with group or service account",
		},
		{
			name:       "invalid: group can not be used in conjunction with service account",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				Group:          "some-group",
				ServiceAccount: "sa",
			},
			expectedErrorMsg: "group can not be used in conjunction with email or service account",
		},
		{
			name:       "invalid: user email can not be used in conjunction with service account namespace",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				Group:                   "some-group",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "group can not be used in conjunction with email or service account",
		},

		{
			name:       "invalid: both service account and service account namespace must be defined (sa namespace empty)",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				ServiceAccount:          "sa",
				ServiceAccountNamespace: "",
			},
			expectedErrorMsg: "both service account and service account namespace must be defined",
		},
		{
			name:       "invalid: both service account and service account namespace must be defined (sa empty)",
			projectReq: common.ProjectReq{ProjectID: "project-id"},
			body: apiv1.RoleUser{
				ServiceAccount:          "",
				ServiceAccountNamespace: "default",
			},
			expectedErrorMsg: "both service account and service account namespace must be defined",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := cluster.RoleUserReq{
				ProjectReq: tt.projectReq,
				Body:       tt.body,
			}

			err := req.Validate()

			if len(tt.expectedErrorMsg) > 0 {
				if err == nil {
					t.Fatalf("expect error '%s' but got nil", tt.expectedErrorMsg)
				}
				if tt.expectedErrorMsg != err.Error() {
					t.Errorf("expected error '%s' got '%s'", tt.expectedErrorMsg, err.Error())
				}
			} else if err != nil {
				t.Fatalf("expect no error but got error=%s", err)
			}
		})
	}
}
