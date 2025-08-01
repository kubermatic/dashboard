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

package admin_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestGetGlobalSettings(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		expectedResponse       string
		httpStatus             int
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
	}{
		// scenario 1
		{
			name:                   "scenario 1: user gets settings first time",
			expectedResponse:       `{"customLinks":[],"defaultNodeCount":2,"displayDemoInfo":false,"displayAPIDocs":false,"displayTermsOfService":false,"enableDashboard":true,"enableOIDCKubeconfig":false,"userProjectsLimit":0,"restrictProjectCreation":false,"restrictProjectDeletion":false,"restrictProjectModification":false,"enableExternalClusterImport":true,"cleanupOptions":{},"opaOptions":{},"mlaOptions":{},"mlaAlertmanagerPrefix":"","mlaGrafanaPrefix":"","notifications":{},"providerConfiguration":{"openStack":{},"vmwareCloudDirector":{}},"webTerminalOptions":{"enabled":false},"machineDeploymentVMResourceQuota":{"minCPU":2,"maxCPU":32,"minRAM":2,"maxRAM":128,"enableGPU":false},"machineDeploymentOptions":{},"annotations":{"hiddenAnnotations":["kubectl.kubernetes.io/last-applied-configuration","kubermatic.io/initial-application-installations-request","kubermatic.io/initial-machinedeployment-request","kubermatic.io/initial-cni-values-request"],"protectedAnnotations":["presetName"]}}`,
			httpStatus:             http.StatusOK,
			existingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true)},
			existingAPIUser:        test.GenDefaultAPIUser(),
		},
		// scenario 2
		{
			name:             "scenario 2: user gets existing global settings",
			expectedResponse: `{"customLinks":[{"label":"label","url":"url:label","icon":"icon","location":"EU"}],"defaultNodeCount":5,"displayDemoInfo":true,"displayAPIDocs":true,"displayTermsOfService":true,"enableDashboard":false,"enableShareCluster":true,"enableOIDCKubeconfig":false,"enableEtcdBackup":true,"userProjectsLimit":0,"restrictProjectCreation":false,"restrictProjectDeletion":false,"restrictProjectModification":false,"enableExternalClusterImport":true,"cleanupOptions":{"enabled":true,"enforced":true},"opaOptions":{"enabled":true,"enforced":true},"mlaOptions":{"loggingEnabled":true,"loggingEnforced":true,"monitoringEnabled":true,"monitoringEnforced":true},"mlaAlertmanagerPrefix":"","mlaGrafanaPrefix":"","notifications":{},"providerConfiguration":{"openStack":{},"vmwareCloudDirector":{}},"defaultQuota":{"quota":{"cpu":2,"memory":5,"storage":10}},"machineDeploymentOptions":{},"annotations":{"hiddenAnnotations":["kubectl.kubernetes.io/last-applied-configuration","kubermatic.io/initial-application-installations-request","kubermatic.io/initial-machinedeployment-request","kubermatic.io/initial-cni-values-request"],"protectedAnnotations":["presetName"]}}`,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true),
				test.GenDefaultGlobalSettings()},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/settings", strings.NewReader(""))
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

func TestUpdateGlobalSettings(t *testing.T) {
	t.Parallel()

	testcases := []struct {
		name                   string
		body                   string
		expectedResponse       string
		httpStatus             int
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
	}{
		// scenario 1
		{
			name:                   "scenario 1: unauthorized user updates settings",
			body:                   `{"customLinks":[{"label":"label","url":"url:label","icon":"icon","location":"EU"}],"cleanupOptions":{"enabled":true,"enforced":true},"defaultNodeCount":100,"displayDemoInfo":false,"displayAPIDocs":false,"displayTermsOfService":true}`,
			expectedResponse:       `{"error":{"code":403,"message":"forbidden: \"bob@acme.com\" doesn't have admin rights"}}`,
			httpStatus:             http.StatusForbidden,
			existingKubermaticObjs: test.GenDefaultKubermaticObjects(),
			existingAPIUser:        test.GenDefaultAPIUser(),
		},
		// scenario 2
		{
			name:                   "scenario 2: authorized user updates default settings",
			body:                   `{"customLinks":[{"label":"label","url":"url:label","icon":"icon","location":"EU"}],"cleanupOptions":{"enabled":true,"enforced":true},"defaultNodeCount":100,"displayDemoInfo":false,"displayAPIDocs":false,"displayTermsOfService":true,"machineDeploymentOptions":{}}`,
			expectedResponse:       `{"customLinks":[{"label":"label","url":"url:label","icon":"icon","location":"EU"}],"defaultNodeCount":100,"displayDemoInfo":false,"displayAPIDocs":false,"displayTermsOfService":true,"enableDashboard":true,"enableOIDCKubeconfig":false,"userProjectsLimit":0,"restrictProjectCreation":false,"restrictProjectDeletion":false,"restrictProjectModification":false,"enableExternalClusterImport":true,"cleanupOptions":{"enabled":true,"enforced":true},"opaOptions":{},"mlaOptions":{},"mlaAlertmanagerPrefix":"","mlaGrafanaPrefix":"","notifications":{},"providerConfiguration":{"openStack":{},"vmwareCloudDirector":{}},"webTerminalOptions":{"enabled":false},"machineDeploymentVMResourceQuota":{"minCPU":2,"maxCPU":32,"minRAM":2,"maxRAM":128,"enableGPU":false},"machineDeploymentOptions":{},"annotations":{"hiddenAnnotations":["kubectl.kubernetes.io/last-applied-configuration","kubermatic.io/initial-application-installations-request","kubermatic.io/initial-machinedeployment-request","kubermatic.io/initial-cni-values-request"],"protectedAnnotations":["presetName"]}}`,
			httpStatus:             http.StatusOK,
			existingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true)},
			existingAPIUser:        test.GenDefaultAPIUser(),
		},
		// scenario 3
		{
			name:             "scenario 3: authorized user updates existing global settings",
			body:             `{"customLinks":[],"cleanupOptions":{"enabled":true,"enforced":true},"defaultNodeCount":100,"displayDemoInfo":false,"displayAPIDocs":false,"displayTermsOfService":true,"userProjectsLimit":10,"restrictProjectCreation":true,"restrictProjectDeletion":false,"restrictProjectModification":false,"defaultQuota":{"cpu":4,"storage":12},"machineDeploymentOptions":{}}`,
			expectedResponse: `{"customLinks":[],"defaultNodeCount":100,"displayDemoInfo":false,"displayAPIDocs":false,"displayTermsOfService":true,"enableDashboard":false,"enableShareCluster":true,"enableOIDCKubeconfig":false,"enableEtcdBackup":true,"userProjectsLimit":10,"restrictProjectCreation":true,"restrictProjectDeletion":false,"restrictProjectModification":false,"enableExternalClusterImport":true,"cleanupOptions":{"enabled":true,"enforced":true},"opaOptions":{"enabled":true,"enforced":true},"mlaOptions":{"loggingEnabled":true,"loggingEnforced":true,"monitoringEnabled":true,"monitoringEnforced":true},"mlaAlertmanagerPrefix":"","mlaGrafanaPrefix":"","notifications":{},"providerConfiguration":{"openStack":{},"vmwareCloudDirector":{}},"defaultQuota":{"quota":{"cpu":2,"memory":5,"storage":10}},"machineDeploymentOptions":{},"annotations":{"hiddenAnnotations":["kubectl.kubernetes.io/last-applied-configuration","kubermatic.io/initial-application-installations-request","kubermatic.io/initial-machinedeployment-request","kubermatic.io/initial-cni-values-request"],"protectedAnnotations":["presetName"]}}`,
			httpStatus:       http.StatusOK,
			existingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true),
				test.GenDefaultGlobalSettings()},
			existingAPIUser: test.GenDefaultAPIUser(),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			var kubernetesObj []ctrlruntimeclient.Object
			var kubeObj []ctrlruntimeclient.Object
			req := httptest.NewRequest(http.MethodPatch, "/api/v1/admin/settings", strings.NewReader(tc.body))
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

func genUser(name, email string, isAdmin bool) *kubermaticv1.User {
	user := test.GenUser("", name, email)
	user.Spec.IsAdmin = isAdmin
	return user
}
