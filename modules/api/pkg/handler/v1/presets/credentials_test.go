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

package presets_test

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/test/diff"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/client-go/kubernetes/scheme"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func init() {
	utilruntime.Must(kubermaticv1.AddToScheme(scheme.Scheme))
}

func TestCredentialEndpoint(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		name             string
		provider         string
		datacenter       string
		credentials      []ctrlruntimeclient.Object
		httpStatus       int
		expectedResponse string
	}{
		{
			name:     "test no credentials for AWS",
			provider: "aws",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "second",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
					},
				},
			},

			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for AWS",
			provider: "aws",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{

					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							AccessKeyID: "a",
						},
					},
				},
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "second",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							AccessKeyID: "a",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first", "second"]}`,
		},
		{
			name:       "test list of credential names for AWS for the specific datacenter",
			provider:   "aws",
			datacenter: "a",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{

					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							ProviderPreset: kubermaticv1.ProviderPreset{Datacenter: "b"},
							AccessKeyID:    "a",
						},
					},
				},
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "second",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							ProviderPreset: kubermaticv1.ProviderPreset{Datacenter: "a"},
							AccessKeyID:    "a",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["second"]}`,
		},
		{
			name:       "test list of credential names for AWS for all and specific datacenter",
			provider:   "aws",
			datacenter: "a",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{

					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							ProviderPreset: kubermaticv1.ProviderPreset{Datacenter: "b"},
							AccessKeyID:    "a",
						},
					},
				},
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "second",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							ProviderPreset: kubermaticv1.ProviderPreset{Datacenter: "a"},
							AccessKeyID:    "a",
						},
					},
				},
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "third",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						AWS: &kubermaticv1.AWS{
							AccessKeyID: "a",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["second", "third"]}`,
		},
		{
			name:             "test no credentials for Azure",
			provider:         "azure",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for Azure",
			provider: "azure",
			credentials: []ctrlruntimeclient.Object{

				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Azure: &kubermaticv1.Azure{
							ClientID: "test-first", ClientSecret: "secret-first", SubscriptionID: "subscription-first", TenantID: "tenant-first",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first"]}`,
		},
		{
			name:             "test no credentials for DigitalOcean",
			provider:         "digitalocean",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for DigitalOcean",
			provider: "digitalocean",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "digitalocean-first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Digitalocean: &kubermaticv1.Digitalocean{
							Token: "took",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["digitalocean-first"]}`,
		},
		{
			name:             "test no credentials for GCP",
			provider:         "gcp",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for GCP",
			provider: "gcp",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						GCP: &kubermaticv1.GCP{
							ServiceAccount: "sa",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first"]}`,
		},
		{
			name:             "test no credentials for Hetzner",
			provider:         "hetzner",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for Hetzner",
			provider: "hetzner",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Hetzner: &kubermaticv1.Hetzner{
							Token: "aa",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first"]}`,
		},
		{
			name:             "test no credentials for OpenStack",
			provider:         "openstack",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for OpenStack",
			provider: "openstack",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Openstack: &kubermaticv1.Openstack{
							Password: "password",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first"]}`,
		},
		{
			name:             "test no credentials for Packet",
			provider:         "packet",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for Packet",
			provider: "packet",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Packet: &kubermaticv1.Packet{
							APIKey: "key",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first"]}`,
		},
		{
			name:             "test no credentials for Vsphere",
			provider:         "vsphere",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for Vsphere",
			provider: "vsphere",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						VSphere: &kubermaticv1.VSphere{
							Password: "password",
						},
					},
				},
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "second",
					},
					Spec: kubermaticv1.PresetSpec{
						VSphere: &kubermaticv1.VSphere{
							Password: "password",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first", "second"]}`,
		},
		{
			name:     "test list of credential names for Anexia",
			provider: "anexia",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "anexia-first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Anexia: &kubermaticv1.Anexia{
							Token: "token",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["anexia-first"]}`,
		},
		{
			name:     "test list of credential names for Nutanix",
			provider: "nutanix",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "nutanix-first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						Nutanix: &kubermaticv1.Nutanix{
							Username:    "username",
							Password:    "password",
							ClusterName: "cluster",
							ProjectName: "project",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["nutanix-first"]}`,
		},
		{
			name:             "test no credentials for Nutanix",
			provider:         "nutanix",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:             "test no credentials for VMware Cloud Director",
			provider:         "vmwareclouddirector",
			httpStatus:       http.StatusOK,
			expectedResponse: "{}",
		},
		{
			name:     "test list of credential names for VMware Cloud Director",
			provider: "vmwareclouddirector",
			credentials: []ctrlruntimeclient.Object{
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "first",
					},
					Spec: kubermaticv1.PresetSpec{
						RequiredEmails: []string{test.RequiredEmailDomain},
						VMwareCloudDirector: &kubermaticv1.VMwareCloudDirector{
							Password: "password",
							Username: "useranme",
						},
					},
				},
				&kubermaticv1.Preset{
					ObjectMeta: metav1.ObjectMeta{
						Name: "second",
					},
					Spec: kubermaticv1.PresetSpec{
						VMwareCloudDirector: &kubermaticv1.VMwareCloudDirector{
							Password: "password",
							Username: "useranme",
						},
					},
				},
			},
			httpStatus:       http.StatusOK,
			expectedResponse: `{"names":["first", "second"]}`,
		},
		{
			name:       "test no existing provider",
			provider:   "test",
			httpStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/providers/%s/presets/credentials?datacenter=%s", tc.provider, tc.datacenter), strings.NewReader(""))
			res := httptest.NewRecorder()

			apiUser := test.GenDefaultAPIUser()
			router, err := test.CreateTestEndpoint(*apiUser, nil, tc.credentials, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			router.ServeHTTP(res, req)

			// validate
			assert.Equal(t, tc.httpStatus, res.Code)

			if res.Code == http.StatusOK {
				compareJSON(t, res, tc.expectedResponse)
			}
		})
	}
}

func compareJSON(t *testing.T, res *httptest.ResponseRecorder, expectedResponseString string) {
	t.Helper()
	var actualResponse interface{}
	var expectedResponse interface{}

	// var err error
	bBytes, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal("Unable to read response body")
	}
	err = json.Unmarshal(bBytes, &actualResponse)
	if err != nil {
		t.Fatalf("Error marshaling string 1 :: %s", err.Error())
	}
	err = json.Unmarshal([]byte(expectedResponseString), &expectedResponse)
	if err != nil {
		t.Fatalf("Error marshaling string 2 :: %s", err.Error())
	}

	if !diff.SemanticallyEqual(expectedResponse, actualResponse) {
		t.Fatalf("Objects are different:\n%v", diff.ObjectDiff(expectedResponse, actualResponse))
	}
}
