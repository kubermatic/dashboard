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

package seedoverview_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestGetSeedOverview(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		name                   string
		seedName               string
		existingAPIUser        *apiv1.User
		existingKubermaticObjs []ctrlruntimeclient.Object
		expectedHTTPStatus     int
		expectedResponse       apiv2.SeedOverview
	}{
		{
			name:            "scenario 1: get seed's overview",
			seedName:        test.GenTestSeed().Name,
			existingAPIUser: test.GenDefaultAdminAPIUser(),
			existingKubermaticObjs: []ctrlruntimeclient.Object{
				test.GenDefaultAdminUser(),
				test.GenTestSeed(),
				test.GenDefaultProject(),
				test.GenDefaultCluster(),
			},
			expectedHTTPStatus: http.StatusOK,
			expectedResponse: apiv2.SeedOverview{
				Name:     "us-central1",
				Location: "us-central",
				DatacentersByProvider: apiv2.DatacentersByProvider{
					"digitalocean": apiv2.ClustersByDatacenter{
						"private-do1": 0,
						"regular-do1": 0,
					},
					"fake": apiv2.ClustersByDatacenter{
						"audited-dc":          0,
						"fake-dc":             0,
						"node-dc":             0,
						"private-do1":         1,
						"psp-dc":              0,
						"restricted-fake-dc":  0,
						"restricted-fake-dc2": 0,
					},
					"kubevirt": apiv2.ClustersByDatacenter{
						"KubevirtDC": 0,
					},
				},
			},
		},
		{
			name:            "scenario 2: non admin user",
			seedName:        test.GenTestSeed().Name,
			existingAPIUser: test.GenDefaultAPIUser(),
			existingKubermaticObjs: []ctrlruntimeclient.Object{
				test.GenDefaultUser(),
				test.GenTestSeed(),
				test.GenDefaultProject(),
				test.GenDefaultCluster(),
			},
			expectedHTTPStatus: http.StatusUnauthorized,
		},
		{
			name:            "scenario 3: non existing seed",
			seedName:        test.GenTestSeed().Name,
			existingAPIUser: test.GenDefaultAPIUser(),
			existingKubermaticObjs: []ctrlruntimeclient.Object{
				test.GenDefaultUser(),
			},
			expectedHTTPStatus: http.StatusNotFound,
		},
	}
	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, requestURL(tc.seedName), nil)
			resp := httptest.NewRecorder()
			ep, err := test.CreateTestEndpoint(*tc.existingAPIUser, nil, tc.existingKubermaticObjs, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.expectedHTTPStatus {
				t.Fatalf("expected HTTP status code %d, got %d: %s", tc.expectedHTTPStatus, resp.Code, resp.Body.String())
			}

			if resp.Code == http.StatusOK {
				b, err := json.Marshal(tc.expectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response: %v", err)
				}
				test.CompareWithResult(t, resp, string(b))
			}
		})
	}
}

func requestURL(seedName string) string {
	return fmt.Sprintf("/api/v2/seeds/%s/overview", seedName)
}
