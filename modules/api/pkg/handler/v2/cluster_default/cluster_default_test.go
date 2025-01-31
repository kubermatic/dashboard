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

package clusterdefault_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestGetEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		Provider                  kubermaticv1.ProviderType
		DC                        string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedResponse          string
		ExpectedHTTPStatusCode    int
	}{
		{
			Name:     "Default cluster for AWS",
			Provider: kubermaticv1.AWSCloudProvider,
			DC:       "fake-dc",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
			),
			ExistingAPIUser:        test.GenDefaultAPIUser(),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       `{"name":"","creationTimestamp":"0001-01-01T00:00:00Z","type":"kubernetes","spec":{"cloud":{"dc":"fake-dc","aws":{}},"version":"v1.31.1","oidc":{},"enableUserSSHKeyAgent":true,"kubernetesDashboard":{"enabled":true},"containerRuntime":"containerd","clusterNetwork":{"ipFamily":"IPv4","services":{"cidrBlocks":["10.240.16.0/20","fd02::/120"]},"pods":{"cidrBlocks":["172.25.0.0/16","fd01::/48"]},"nodeCidrMaskSizeIPv4":24,"nodeCidrMaskSizeIPv6":64,"dnsDomain":"cluster.local","proxyMode":"ipvs","ipvs":{"strictArp":true},"nodeLocalDNSCacheEnabled":true},"cniPlugin":{"type":"cilium","version":"1.16.6"},"exposeStrategy":"NodePort"},"status":{"version":"","url":"","externalCCMMigration":""}}`,
		},
		{
			Name:     "Default cluster for Azure",
			Provider: kubermaticv1.AzureCloudProvider,
			DC:       "fake-dc",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
			),
			ExistingAPIUser:        test.GenDefaultAPIUser(),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       `{"name":"","creationTimestamp":"0001-01-01T00:00:00Z","type":"kubernetes","spec":{"cloud":{"dc":"fake-dc","azure":{"assignAvailabilitySet":null}},"version":"v1.31.1","oidc":{},"enableUserSSHKeyAgent":true,"kubernetesDashboard":{"enabled":true},"containerRuntime":"containerd","clusterNetwork":{"ipFamily":"IPv4","services":{"cidrBlocks":["10.240.16.0/20","fd02::/120"]},"pods":{"cidrBlocks":["172.25.0.0/16","fd01::/48"]},"nodeCidrMaskSizeIPv4":24,"nodeCidrMaskSizeIPv6":64,"dnsDomain":"cluster.local","proxyMode":"ipvs","ipvs":{"strictArp":true},"nodeLocalDNSCacheEnabled":true},"cniPlugin":{"type":"cilium","version":"1.16.6"},"exposeStrategy":"NodePort"},"status":{"version":"","url":"","externalCCMMigration":""}}`,
		},
		{
			Name:     "Default cluster for vSphere",
			Provider: kubermaticv1.VSphereCloudProvider,
			DC:       "fake-dc",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
			),
			ExistingAPIUser:        test.GenDefaultAPIUser(),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       `{"name":"","creationTimestamp":"0001-01-01T00:00:00Z","type":"kubernetes","spec":{"cloud":{"dc":"fake-dc","vsphere":{}},"version":"v1.31.1","oidc":{},"enableUserSSHKeyAgent":true,"kubernetesDashboard":{"enabled":true},"containerRuntime":"containerd","clusterNetwork":{"ipFamily":"IPv4","services":{"cidrBlocks":["10.240.16.0/20","fd02::/120"]},"pods":{"cidrBlocks":["172.25.0.0/16","fd01::/48"]},"nodeCidrMaskSizeIPv4":24,"nodeCidrMaskSizeIPv6":64,"dnsDomain":"cluster.local","proxyMode":"ipvs","ipvs":{"strictArp":true},"nodeLocalDNSCacheEnabled":true},"cniPlugin":{"type":"cilium","version":"1.16.6"},"exposeStrategy":"NodePort"},"status":{"version":"","url":"","externalCCMMigration":""}}`,
		},
		{
			Name:     "Default cluster for GCP",
			Provider: kubermaticv1.GCPCloudProvider,
			DC:       "fake-dc",
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
			),
			ExistingAPIUser:        test.GenDefaultAPIUser(),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse:       `{"name":"","creationTimestamp":"0001-01-01T00:00:00Z","type":"kubernetes","spec":{"cloud":{"dc":"fake-dc","gcp":{}},"version":"v1.31.1","oidc":{},"enableUserSSHKeyAgent":true,"kubernetesDashboard":{"enabled":true},"containerRuntime":"containerd","clusterNetwork":{"ipFamily":"IPv4","services":{"cidrBlocks":["10.240.16.0/20","fd02::/120"]},"pods":{"cidrBlocks":["172.25.0.0/16","fd01::/48"]},"nodeCidrMaskSizeIPv4":24,"nodeCidrMaskSizeIPv6":64,"dnsDomain":"cluster.local","proxyMode":"ipvs","ipvs":{"strictArp":true},"nodeLocalDNSCacheEnabled":true},"cniPlugin":{"type":"cilium","version":"1.16.6"},"exposeStrategy":"NodePort"},"status":{"version":"","url":"","externalCCMMigration":""}}`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/providers/%s/dc/%s/defaultcluster", tc.Provider, tc.DC)
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
				test.CompareWithResult(t, resp, tc.ExpectedResponse)
			}
		})
	}
}
