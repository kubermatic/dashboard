/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

package applicationdefinition_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	appskubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/apps.kubermatic/v1"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestListApplicationDefinitions(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name               string
		ExistingAPIUser    *apiv1.User
		ExistingObjects    []ctrlruntimeclient.Object
		ExpectedHTTPStatus int
		ExpectedAppDefs    []apiv2.ApplicationDefinitionListItem
	}{
		{
			Name:            "admin can list all applicationdefinitions",
			ExistingAPIUser: test.GenDefaultAPIUser(),
			ExistingObjects: test.GenDefaultKubermaticObjects(
				test.GenApplicationDefinition("appdef1"),
				test.GenApplicationDefinition("appdef2"),
			),
			ExpectedHTTPStatus: http.StatusOK,
			ExpectedAppDefs: []apiv2.ApplicationDefinitionListItem{
				test.GenApiApplicationDefinitionListItem("appdef1"),
				test.GenApiApplicationDefinitionListItem("appdef2"),
			},
		},
		{
			Name:            "user can list all applicationdefinitions",
			ExistingAPIUser: test.GenDefaultAPIUser(),
			ExistingObjects: test.GenDefaultKubermaticObjects(
				test.GenApplicationDefinition("appdef1"),
				test.GenApplicationDefinition("appdef2"),
			),
			ExpectedHTTPStatus: http.StatusOK,
			ExpectedAppDefs: []apiv2.ApplicationDefinitionListItem{
				test.GenApiApplicationDefinitionListItem("appdef1"),
				test.GenApiApplicationDefinitionListItem("appdef2"),
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v2/applicationdefinitions", nil)
			res := httptest.NewRecorder()

			ep, _, err := test.CreateTestEndpointAndGetClients(*tc.ExistingAPIUser, nil, nil, nil, tc.ExistingObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.ExpectedHTTPStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatus, res.Code, res.Body.String())
			}

			wrapAppDef := test.NewApplicationDefinitionWrapper{}
			wrapAppDef.DecodeOrDie(res.Body, t).Sort()

			wrapExpAppDef := test.NewApplicationDefinitionWrapper(tc.ExpectedAppDefs)
			wrapAppDef.Sort()

			wrapAppDef.EqualOrDie(wrapExpAppDef, t)
		})
	}
}

func TestGetApplicationDefinition(t *testing.T) {
	t.Parallel()
	const app1Name = "app1"
	const app2Name = "app2"
	testcases := []struct {
		Name                      string
		AppDefName                string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedResponse          apiv2.ApplicationDefinition
		ExpectedHTTPStatusCode    int
	}{
		{
			Name:       "admin can get an existing appplicationdefinition",
			AppDefName: app1Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				test.GenApplicationDefinition(app1Name),
				test.GenApplicationDefinition(app2Name),
			),
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       test.GenApiApplicationDefinition(app1Name),
		},
		{
			Name:       "user can get an existing appplicationdefinition",
			AppDefName: app1Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				test.GenApplicationDefinition(app1Name),
				test.GenApplicationDefinition(app2Name),
			),
			ExistingAPIUser:        test.GenDefaultAPIUser(),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       test.GenApiApplicationDefinition(app1Name),
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/applicationdefinitions/%s", tc.AppDefName)
			req := httptest.NewRequest(http.MethodGet, requestURL, nil)
			res := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint due to: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.ExpectedHTTPStatusCode {
				t.Errorf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, res.Code, res.Body.String())
				return
			}

			if res.Code == http.StatusOK {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response: %v", err)
				}
				test.CompareWithResult(t, res, string(b))
			}
		})
	}
}

func TestCreateApplicationDefinition(t *testing.T) {
	t.Parallel()
	const appname = "app1"
	testcases := []struct {
		Name                   string
		ExistingAPIUser        *apiv1.User
		ExistingKubermaticObjs []ctrlruntimeclient.Object
		ApplicationDefinition  apiv2.ApplicationDefinition
		ExpectedResponse       apiv2.ApplicationDefinition
		ExpectedHTTPStatusCode int
	}{
		{
			Name:                   "admin can create an applicationdefinition",
			ApplicationDefinition:  test.GenApiApplicationDefinition(appname),
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true)},
			ExpectedResponse:       test.GenApiApplicationDefinition(appname),
			ExpectedHTTPStatusCode: http.StatusCreated,
		},
		{
			Name:                   "defaultValues are converted to defaultValuesBlock",
			ApplicationDefinition:  test.GenApiApplicationDefinitionWithDefaultValues(appname),
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true)},
			ExpectedResponse:       test.GenApiApplicationDefinitionWithDefaultValuesBlock(appname),
			ExpectedHTTPStatusCode: http.StatusCreated,
		},
		{
			Name:                   "user cannot create an applicationdefinition",
			ApplicationDefinition:  test.GenApiApplicationDefinition(appname),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExistingKubermaticObjs: test.GenDefaultKubermaticObjects(),
			ExpectedResponse:       apiv2.ApplicationDefinition{},
			ExpectedHTTPStatusCode: http.StatusForbidden,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := "/api/v2/applicationdefinitions"
			body, err := json.Marshal(tc.ApplicationDefinition)
			if err != nil {
				t.Fatalf("failed to marshal ApplicationDefinition: %v", err)
			}
			req := httptest.NewRequest(http.MethodPost, requestURL, bytes.NewBuffer(body))
			res := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjs, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint due to: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.ExpectedHTTPStatusCode {
				t.Errorf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, res.Code, res.Body.String())
				return
			}

			if res.Code == http.StatusOK {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response: %v", err)
				}
				test.CompareWithResult(t, res, string(b))
			}
		})
	}
}

func TestUpdateApplicationDefinitions(t *testing.T) {
	appname := "app1"
	newVersion := "v2.0.0"
	testcases := []struct {
		Name                   string
		ExistingAPIUser        *apiv1.User
		ExistingKubermaticObjs []ctrlruntimeclient.Object
		ApplicationDefinition  apiv2.ApplicationDefinition
		ExpectedResponse       apiv2.ApplicationDefinition
		ExpectedHTTPStatusCode int
	}{
		{
			Name: "admin can update an applicationdefinition",
			ApplicationDefinition: func() apiv2.ApplicationDefinition {
				app := test.GenApiApplicationDefinition(appname)
				app.Spec.Versions = append(app.Spec.Versions, appskubermaticv1.ApplicationVersion{Version: newVersion, Template: appskubermaticv1.ApplicationTemplate{}})
				return app
			}(),
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true), test.GenApplicationDefinition(appname)},
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: apiv2.ApplicationDefinition{
				ObjectMeta: apiv1.ObjectMeta{
					Name: appname,
				},
				Spec: &appskubermaticv1.ApplicationDefinitionSpec{
					Method: appskubermaticv1.HelmTemplateMethod,
					Versions: []appskubermaticv1.ApplicationVersion{
						{
							Version: "v1.0.0",
							Template: appskubermaticv1.ApplicationTemplate{

								Source: appskubermaticv1.ApplicationSource{
									Helm: &appskubermaticv1.HelmSource{
										URL:          "https://charts.example.com",
										ChartName:    appname,
										ChartVersion: "v1.0.0",
									},
								},
							},
						},
						{
							Version: "v1.1.0",
							Template: appskubermaticv1.ApplicationTemplate{
								Source: appskubermaticv1.ApplicationSource{
									Git: &appskubermaticv1.GitSource{
										Remote: "https://git.example.com",
										Ref: appskubermaticv1.GitReference{
											Branch: "main",
											Tag:    "v1.1.0",
										},
									},
								},
							},
						},
						{
							Version:  newVersion,
							Template: appskubermaticv1.ApplicationTemplate{},
						},
					},
				},
			},
		},
		{
			Name:                   "defaultValues are converted to defaultValuesBlock",
			ApplicationDefinition:  test.GenApiApplicationDefinitionWithDefaultValuesBlock(appname),
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true), test.GenApplicationDefinition(appname)},
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       test.GenApiApplicationDefinitionWithDefaultValuesBlock(appname),
		},
		{
			Name:                   "user cannot update an applicationdefinition",
			ApplicationDefinition:  test.GenApiApplicationDefinition(appname),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExistingKubermaticObjs: append(test.GenDefaultKubermaticObjects(), test.GenApplicationDefinition(appname)),
			ExpectedResponse:       apiv2.ApplicationDefinition{},
			ExpectedHTTPStatusCode: http.StatusForbidden,
		},
		{
			Name:                   "try to update an applicationdefinition that does not exist",
			ApplicationDefinition:  test.GenApiApplicationDefinition(appname),
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true)},
			ExpectedResponse:       apiv2.ApplicationDefinition{},
			ExpectedHTTPStatusCode: http.StatusNotFound,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/applicationdefinitions/%s", tc.ApplicationDefinition.Name)
			body, err := json.Marshal(tc.ApplicationDefinition)
			if err != nil {
				t.Fatalf("failed to marshal ApplicationDefinition: %v", err)
			}
			req := httptest.NewRequest(http.MethodPut, requestURL, bytes.NewBuffer(body))
			res := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjs, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint due to: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.ExpectedHTTPStatusCode {
				t.Errorf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, res.Code, res.Body.String())
				return
			}

			if res.Code == http.StatusOK {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response: %v", err)
				}
				test.CompareWithResult(t, res, string(b))
			}
		})
	}
}

func TestDeleteApplicationDefinitions(t *testing.T) {
	appname1 := "app1"
	appname2 := "app2"
	testcases := []struct {
		Name                   string
		ExistingAPIUser        *apiv1.User
		AppToDelete            string
		ExistingKubermaticObjs []ctrlruntimeclient.Object
		ExpectedHTTPStatusCode int
		ExpectedAppDefCount    int
	}{
		{
			Name:                   "admin can delete an applicationdefinition",
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true), test.GenApplicationDefinition(appname1), test.GenApplicationDefinition(appname2)},
			AppToDelete:            appname1,
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedAppDefCount:    1,
		},
		{
			Name:                   "user cannot update an applicationdefinition",
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExistingKubermaticObjs: append(test.GenDefaultKubermaticObjects(), test.GenApplicationDefinition(appname1), test.GenApplicationDefinition(appname2)),
			AppToDelete:            appname1,
			ExpectedHTTPStatusCode: http.StatusForbidden,
			ExpectedAppDefCount:    2,
		},
		{
			Name:                   "try to update an applicationdefinition that does not exist",
			ExistingAPIUser:        test.GenDefaultAdminAPIUser(),
			ExistingKubermaticObjs: []ctrlruntimeclient.Object{genUser("Bob", "bob@acme.com", true), test.GenApplicationDefinition(appname1), test.GenApplicationDefinition(appname2)},
			AppToDelete:            "does-not-exist",
			ExpectedHTTPStatusCode: http.StatusNotFound,
			ExpectedAppDefCount:    2,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/applicationdefinitions/%s", tc.AppToDelete)
			req := httptest.NewRequest(http.MethodDelete, requestURL, nil)
			res := httptest.NewRecorder()

			ep, clients, err := test.CreateTestEndpointAndGetClients(*tc.ExistingAPIUser, nil, nil, nil, tc.ExistingKubermaticObjs, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint due to: %v", err)
			}

			ep.ServeHTTP(res, req)

			if res.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, res.Code, res.Body.String())
			}

			appDefs := &appskubermaticv1.ApplicationDefinitionList{}
			if err := clients.FakeMasterClient.List(context.Background(), appDefs); err != nil {
				t.Fatalf("failed to list ApplicationDefinitions: %v", err)
			}

			if count := len(appDefs.Items); tc.ExpectedAppDefCount != count {
				t.Errorf("Expected %d  ApplicationDefinitions but got %d", tc.ExpectedAppDefCount, count)
			}
		})
	}
}

func genUser(name, email string, isAdmin bool) *kubermaticv1.User {
	user := test.GenUser("", name, email)
	user.Spec.IsAdmin = isAdmin
	return user
}
