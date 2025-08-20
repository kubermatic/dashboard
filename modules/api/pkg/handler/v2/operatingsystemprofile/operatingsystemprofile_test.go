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

package operatingsystemprofile_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	osmv1alpha1 "k8c.io/operating-system-manager/pkg/crd/osm/v1alpha1"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestListOperatingSystemProfiles(t *testing.T) {
	testCases := []struct {
		name                  string
		existingObjects       []ctrlruntimeclient.Object
		apiUser               *apiv1.User
		expectedResult        []*apiv2.OperatingSystemProfile
		expectedHTTPStatus    int
		expectedErrorResponse []byte
	}{
		{
			name: "base case",
			existingObjects: []ctrlruntimeclient.Object{
				genOperatingSystemProfile("test-osp-1", "kubermatic", t),
				genOperatingSystemProfile("test-osp-2", "kubermatic", t),
			},
			apiUser:            test.GenDefaultAPIUser(),
			expectedHTTPStatus: http.StatusOK,
			expectedResult: []*apiv2.OperatingSystemProfile{
				{
					Name:                    "test-osp-1",
					OperatingSystem:         "ubuntu",
					SupportedCloudProviders: []string{"aws"},
				},
				{
					Name:                    "test-osp-2",
					OperatingSystem:         "ubuntu",
					SupportedCloudProviders: []string{"aws"},
				},
				{
					Name:                    "osp-amzn2",
					OperatingSystem:         "amzn2",
					SupportedCloudProviders: []string{"aws"},
				},
				{
					Name:                    "osp-flatcar",
					OperatingSystem:         "flatcar",
					SupportedCloudProviders: []string{"aws", "azure", "gce", "kubevirt", "openstack", "vsphere", "vmware-cloud-director"},
				},
				{
					Name:                    "osp-rhel",
					OperatingSystem:         "rhel",
					SupportedCloudProviders: []string{"aws", "azure", "kubevirt", "openstack", "vsphere"},
				},
				{
					Name:                    "osp-rockylinux",
					OperatingSystem:         "rockylinux",
					SupportedCloudProviders: []string{"aws", "azure", "digitalocean", "hetzner", "kubevirt", "openstack", "vsphere"},
				},
				{
					Name:                    "osp-ubuntu",
					OperatingSystem:         "ubuntu",
					SupportedCloudProviders: []string{"alibaba", "aws", "azure", "baremetal", "digitalocean", "edge", "gce", "hetzner", "kubevirt", "nutanix", "openstack", "vmware-cloud-director", "vsphere"},
				},
			},
		},
		{
			name:               "default OSPs",
			existingObjects:    []ctrlruntimeclient.Object{},
			apiUser:            test.GenDefaultAPIUser(),
			expectedHTTPStatus: http.StatusOK,
			expectedResult: []*apiv2.OperatingSystemProfile{
				{
					Name:                    "osp-amzn2",
					OperatingSystem:         "amzn2",
					SupportedCloudProviders: []string{"aws"},
				},
				{
					Name:                    "osp-flatcar",
					OperatingSystem:         "flatcar",
					SupportedCloudProviders: []string{"aws", "azure", "gce", "kubevirt", "openstack", "vsphere", "vmware-cloud-director"},
				},
				{
					Name:                    "osp-rhel",
					OperatingSystem:         "rhel",
					SupportedCloudProviders: []string{"aws", "azure", "kubevirt", "openstack", "vsphere"},
				},
				{
					Name:                    "osp-rockylinux",
					OperatingSystem:         "rockylinux",
					SupportedCloudProviders: []string{"aws", "azure", "digitalocean", "hetzner", "kubevirt", "openstack", "vsphere"},
				},
				{
					Name:                    "osp-ubuntu",
					OperatingSystem:         "ubuntu",
					SupportedCloudProviders: []string{"alibaba", "aws", "azure", "baremetal", "digitalocean", "edge", "gce", "hetzner", "kubevirt", "nutanix", "openstack", "vmware-cloud-director", "vsphere"},
				},
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.existingObjects = append(tc.existingObjects, test.APIUserToKubermaticUser(*tc.apiUser), test.GenTestSeed())

			req := httptest.NewRequest(http.MethodGet, "/api/v2/seeds/us-central1/operatingsystemprofiles", strings.NewReader(""))
			res := httptest.NewRecorder()
			ep, err := test.CreateTestEndpoint(*tc.apiUser, nil, tc.existingObjects, nil, hack.NewTestRouting)
			assert.NoError(t, err)

			ep.ServeHTTP(res, req)

			assert.Equal(t, tc.expectedHTTPStatus, res.Code)

			if res.Code == http.StatusOK {
				var osps []*apiv2.OperatingSystemProfile
				err = json.Unmarshal(res.Body.Bytes(), &osps)
				assert.NoError(t, err)

				assert.Equal(t, tc.expectedResult, osps)
			} else {
				assert.Equal(t, tc.expectedErrorResponse, res.Body.Bytes())
			}
		})
	}
}

func TestListOperatingSystemProfilesEndpointForCluster(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name                  string
		ProjectID             string
		ClusterID             string
		existingObjects       []ctrlruntimeclient.Object
		apiUser               *apiv1.User
		expectedResult        []*apiv2.OperatingSystemProfile
		expectedHTTPStatus    int
		expectedErrorResponse []byte
	}{
		{
			name:      "should list OSPs",
			ProjectID: test.GenDefaultProject().Name,
			ClusterID: test.GenDefaultCluster().Name,
			existingObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
				genOperatingSystemProfile("test-osp-1", "kube-system", t),
				genOperatingSystemProfile("test-osp-2", "kube-system", t),
			),
			apiUser:            test.GenDefaultAPIUser(),
			expectedHTTPStatus: http.StatusOK,
			expectedResult:     []*apiv2.OperatingSystemProfile{},
		},
		{
			name:      "should return an empty response",
			ProjectID: test.GenDefaultProject().Name,
			ClusterID: test.GenDefaultCluster().Name,
			existingObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			apiUser:            test.GenDefaultAPIUser(),
			expectedHTTPStatus: http.StatusOK,
			expectedResult:     []*apiv2.OperatingSystemProfile{},
		},
		{
			name:      "John cannot list Bob's OSP",
			ProjectID: test.GenDefaultProject().Name,
			ClusterID: test.GenDefaultCluster().Name,
			existingObjects: test.GenDefaultKubermaticObjects(
				test.GenTestSeed(),
				test.GenDefaultCluster(),
			),
			apiUser:            test.GenAPIUser("John", "john@acme.com"),
			expectedHTTPStatus: http.StatusForbidden,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/projects/%s/clusters/%s/operatingsystemprofiles", tc.ProjectID, tc.ClusterID)
			req := httptest.NewRequest(http.MethodGet, requestURL, strings.NewReader(""))
			res := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.apiUser, nil, tc.existingObjects, nil, hack.NewTestRouting)
			assert.NoError(t, err)

			ep.ServeHTTP(res, req)

			if res.Code != tc.expectedHTTPStatus {
				t.Errorf("Expected HTTP status code %d, got %d: %s", tc.expectedHTTPStatus, res.Code, res.Body.String())
				return
			}

			if res.Code == http.StatusForbidden {
				return
			}

			if res.Code == http.StatusOK {
				var osps []*apiv2.OperatingSystemProfile
				err = json.Unmarshal(res.Body.Bytes(), &osps)
				assert.NoError(t, err)

				assert.Equal(t, tc.expectedResult, osps)
			} else {
				assert.Equal(t, tc.expectedErrorResponse, res.Body.Bytes())
			}
		})
	}
}

func genOperatingSystemProfile(name string, namespace string, t *testing.T) *unstructured.Unstructured {
	u := &unstructured.Unstructured{}
	u.SetAPIVersion("operatingsystemmanager.k8c.io/v1alpha1")
	u.SetKind("CustomOperatingSystemProfile")
	u.SetName(name)
	u.SetNamespace(namespace)

	spec := &osmv1alpha1.OperatingSystemProfileSpec{
		OSName: osmv1alpha1.OperatingSystemUbuntu,
		SupportedCloudProviders: []osmv1alpha1.CloudProviderSpec{
			{
				Name: "aws",
			},
		},
		ProvisioningConfig: osmv1alpha1.OSPConfig{
			Units: nil,
		},
	}

	specMap, err := unmarshallToJSONMap(spec)
	if err != nil {
		t.Fatal(err)
	}

	err = unstructured.SetNestedField(u.Object, specMap, "spec")
	if err != nil {
		t.Fatalf("error setting constraint spec field: %v", err)
	}

	return u
}

func unmarshallToJSONMap(object interface{}) (map[string]interface{}, error) {
	raw, err := json.Marshal(object)
	if err != nil {
		return nil, fmt.Errorf("error marshalling: %w", err)
	}
	result := make(map[string]interface{})
	err = json.Unmarshal(raw, &result)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling: %w", err)
	}

	return result, nil
}
