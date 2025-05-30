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

package rulegroupadmin_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestGetEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		RuleGroupName             string
		SeedName                  string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedResponse          *apiv2.RuleGroup
		ExpectedHTTPStatusCode    int
	}{
		{
			Name:          "admin get rule group which doesn't exist",
			RuleGroupName: "test-rule-group",
			SeedName:      test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusNotFound,
		},
		{
			Name:          "user john cannot get rule group that belongs admin",
			RuleGroupName: "test-rule-group",
			SeedName:      test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", false),
				test.GenAdminRuleGroup("test-rule-group", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusUnauthorized,
		},
		{
			Name:          "admin user john can get rule group that belongs to admin",
			RuleGroupName: "test-rule-group",
			SeedName:      test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-rule-group", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/seeds/%s/rulegroups/%s", tc.SeedName, tc.RuleGroupName)
			req := httptest.NewRequest(http.MethodGet, requestURL, nil)
			resp := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}
			if resp.Code == http.StatusOK {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response: %v", err)
				}

				test.CompareWithResult(t, resp, string(b))
			}
		})
	}
}

func TestListEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		SeedName                  string
		QueryParams               map[string]string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedResponse          []*apiv2.RuleGroup
		ExpectedHTTPStatusCode    int
	}{
		{
			Name:     "admin can list all rule groups",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-1", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-2", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-3", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: []*apiv2.RuleGroup{
				test.GenAPIRuleGroup("test-1", kubermaticv1.RuleGroupTypeMetrics, false),
				test.GenAPIRuleGroup("test-2", kubermaticv1.RuleGroupTypeMetrics, false),
				test.GenAPIRuleGroup("test-3", kubermaticv1.RuleGroupTypeMetrics, false),
			},
		},
		{
			Name:     "admin can list rule groups when there is no rule groups",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       []*apiv2.RuleGroup{},
		},
		{
			Name:        "admin can list rule groups with type Metrics",
			SeedName:    test.GenTestSeed().Name,
			QueryParams: map[string]string{"type": "Metrics"},
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-1", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-2", "mla", "FakeType"),
				test.GenAdminRuleGroup("test-3", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-4", "mla", kubermaticv1.RuleGroupTypeLogs),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: []*apiv2.RuleGroup{
				test.GenAPIRuleGroup("test-1", kubermaticv1.RuleGroupTypeMetrics, false),
				test.GenAPIRuleGroup("test-3", kubermaticv1.RuleGroupTypeMetrics, false),
			},
		},
		{
			Name:        "admin can list rule groups with type Logs",
			SeedName:    test.GenTestSeed().Name,
			QueryParams: map[string]string{"type": "Logs"},
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-1", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-2", "mla", "FakeType"),
				test.GenAdminRuleGroup("test-3", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-4", "mla", kubermaticv1.RuleGroupTypeLogs),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: []*apiv2.RuleGroup{
				test.GenAPIRuleGroup("test-4", kubermaticv1.RuleGroupTypeLogs, false),
			},
		},
		{
			Name:        "admin cannot list rule groups with invalid type",
			SeedName:    test.GenTestSeed().Name,
			QueryParams: map[string]string{"type": "FakeType"},
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-1", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-2", "mla", "FakeType"),
				test.GenAdminRuleGroup("test-3", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusBadRequest,
		},
		{
			Name:     "user john cannot list rule groups that belong to admin",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", false),
				test.GenAdminRuleGroup("test-1", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-2", "mla", kubermaticv1.RuleGroupTypeMetrics),
				test.GenAdminRuleGroup("test-3", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusUnauthorized,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/seeds/%s/rulegroups", tc.SeedName)
			req := httptest.NewRequest(http.MethodGet, requestURL, nil)
			if tc.QueryParams != nil {
				q := req.URL.Query()
				for k, v := range tc.QueryParams {
					q.Add(k, v)
				}
				req.URL.RawQuery = q.Encode()
			}
			resp := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}
			if resp.Code == http.StatusOK {
				ruleGroups := test.NewRuleGroupSliceWrapper{}
				ruleGroups.DecodeOrDie(resp.Body, t).Sort()

				expectedRuleGroups := test.NewRuleGroupSliceWrapper(tc.ExpectedResponse)
				expectedRuleGroups.Sort()

				ruleGroups.EqualOrDie(expectedRuleGroups, t)
			}
		})
	}
}

func TestCreateEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		SeedName                  string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		RuleGroup                 *apiv2.RuleGroup
		ExpectedHTTPStatusCode    int
		ExpectedResponse          *apiv2.RuleGroup
	}{
		{
			Name:     "admin can create rule group",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusCreated,
			ExpectedResponse:       test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, true),
		},
		{
			Name:     "admin cannot create rule group in the given cluster because it already exists",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-rule-group", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusConflict,
		},
		{
			Name:     "admin cannot create rule group in the given cluster because the name in data is empty",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusBadRequest,
		},
		{
			Name:     "admin cannot create rule group in the given cluster because the in data cannot be unmarshalled into yaml",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			RuleGroup: &apiv2.RuleGroup{
				Data: []byte("fake data"),
				Type: kubermaticv1.RuleGroupTypeMetrics,
			},
			ExpectedHTTPStatusCode: http.StatusBadRequest,
		},
		{
			Name:     "user john cannot  create rule group via endpoint that is exposed to admin",
			SeedName: test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", false),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusUnauthorized,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/seeds/%s/rulegroups", tc.SeedName)
			body, err := json.Marshal(tc.RuleGroup)
			if err != nil {
				t.Fatalf("failed to marshalling rule group: %v", err)
			}
			req := httptest.NewRequest(http.MethodPost, requestURL, bytes.NewBuffer(body))
			resp := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}
			if resp.Code == http.StatusCreated {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response %v", err)
				}
				test.CompareWithResult(t, resp, string(b))
			}
		})
	}
}

func TestUpdateEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		SeedName                  string
		RuleGroupName             string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		RuleGroup                 *apiv2.RuleGroup
		ExpectedHTTPStatusCode    int
		ExpectedResponse          *apiv2.RuleGroup
	}{
		{
			Name:          "admin can update rule group",
			SeedName:      test.GenTestSeed().Name,
			RuleGroupName: "test-rule-group",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-rule-group", "mla", "UpdateThisType"),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, true),
		},
		{
			Name:          "admin cannot update rule group because it doesn't exists",
			SeedName:      test.GenTestSeed().Name,
			RuleGroupName: "test-rule-group",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusNotFound,
		},
		{
			Name:          "admin cannot update rule group name in the data",
			RuleGroupName: "test-rule-group",
			SeedName:      test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-rule-group", "mla", "UpdateThisType"),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group-2", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusBadRequest,
		},
		{
			Name:          "admin cannot update rule group because the in data cannot be unmarshalled into yaml",
			RuleGroupName: "test-rule-group",
			SeedName:      test.GenTestSeed().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-rule-group", "mla", "UpdateThisType"),
			),
			ExistingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			RuleGroup: &apiv2.RuleGroup{
				Data: []byte("fake data"),
				Type: kubermaticv1.RuleGroupTypeMetrics,
			},
			ExpectedHTTPStatusCode: http.StatusBadRequest,
		},
		{
			Name:          "user john cannot update rule group that belongs to admin",
			SeedName:      test.GenTestSeed().Name,
			RuleGroupName: "test-rule-group",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", false),
				test.GenAdminRuleGroup("test-rule-group", "mla", "UpdateThisType"),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			RuleGroup:              test.GenAPIRuleGroup("test-rule-group", kubermaticv1.RuleGroupTypeMetrics, false),
			ExpectedHTTPStatusCode: http.StatusUnauthorized,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/seeds/%s/rulegroups/%s", tc.SeedName, tc.RuleGroupName)
			body, err := json.Marshal(tc.RuleGroup)
			if err != nil {
				t.Fatalf("failed to marshalling rule group: %v", err)
			}
			req := httptest.NewRequest(http.MethodPut, requestURL, bytes.NewBuffer(body))
			resp := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}
			if resp.Code == http.StatusOK {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response %v", err)
				}
				test.CompareWithResult(t, resp, string(b))
			}
		})
	}
}

func TestDeleteEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		SeedName                  string
		RuleGroupName             string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedHTTPStatusCode    int
	}{
		{
			Name:          "admin can delete rule group",
			SeedName:      test.GenTestSeed().Name,
			RuleGroupName: "test-rule-group",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
				test.GenAdminRuleGroup("test-rule-group", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusOK,
		},
		{
			Name:          "admin cannot delete rule group which doesn't exist",
			SeedName:      test.GenTestSeed().Name,
			RuleGroupName: "test-rule-group",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusNotFound,
		},
		{
			Name:          "user john cannot delete rule group that belongs to admin",
			SeedName:      test.GenTestSeed().Name,
			RuleGroupName: "test-rule-group",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenAdminUser("John", "john@acme.com", false),
				test.GenAdminRuleGroup("test-rule-group", "mla", kubermaticv1.RuleGroupTypeMetrics),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			ExpectedHTTPStatusCode: http.StatusUnauthorized,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/seeds/%s/rulegroups/%s", tc.SeedName, tc.RuleGroupName)
			req := httptest.NewRequest(http.MethodDelete, requestURL, nil)
			resp := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}
		})
	}
}
