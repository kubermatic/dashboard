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

package backupcredentials_test

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
	"k8c.io/dashboard/v2/pkg/handler/v2/backupcredentials"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	testDestination = "s3"
)

func TestCreateOrUpdateEndpoint(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		Seed                      *kubermaticv1.Seed
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingKubeObjects       []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		BackupCredentials         *apiv2.BackupCredentials
		ExpectedHTTPStatusCode    int
	}{
		{
			Name: "non-admin user cannot create backup credentials",
			Seed: test.GenTestSeed(func(seed *kubermaticv1.Seed) {
				seed.Spec.EtcdBackupRestore = &kubermaticv1.EtcdBackupRestore{
					Destinations: map[string]*kubermaticv1.BackupDestination{
						testDestination: {
							Endpoint:   "aws.s3.com",
							BucketName: "testbucket",
						},
					},
				}
			}),
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenDefaultCluster(),
				test.GenAdminUser("John", "john@acme.com", false),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			BackupCredentials:      test.GenDefaultAPIBackupCredentials(),
			ExpectedHTTPStatusCode: http.StatusForbidden,
		},
		{
			Name: "create backup credentials for given seed with destination",
			Seed: test.GenTestSeed(func(seed *kubermaticv1.Seed) {
				seed.Spec.EtcdBackupRestore = &kubermaticv1.EtcdBackupRestore{
					Destinations: map[string]*kubermaticv1.BackupDestination{
						testDestination: {
							Endpoint:   "aws.s3.com",
							BucketName: "testbucket",
						},
					},
				}
			}),
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenDefaultCluster(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			BackupCredentials:      test.GenDefaultAPIBackupCredentials(),
			ExpectedHTTPStatusCode: http.StatusOK,
		},
		{
			Name: "update backup credentials for given seed with destination",
			Seed: test.GenTestSeed(func(seed *kubermaticv1.Seed) {
				seed.Spec.EtcdBackupRestore = &kubermaticv1.EtcdBackupRestore{
					Destinations: map[string]*kubermaticv1.BackupDestination{
						testDestination: {
							Endpoint:   "aws.s3.com",
							BucketName: "testbucket",
							Credentials: &corev1.SecretReference{
								Name:      "secret",
								Namespace: "kubermatic",
							},
						},
					},
				}
			}),
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenDefaultCluster(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser:        test.GenAPIUser("John", "john@acme.com"),
			BackupCredentials:      test.GenDefaultAPIBackupCredentials(),
			ExpectedHTTPStatusCode: http.StatusOK,
		},
		{
			Name: "can't manage backup credentials for non-existing seed destination",
			Seed: test.GenTestSeed(func(seed *kubermaticv1.Seed) {
				seed.Spec.EtcdBackupRestore = &kubermaticv1.EtcdBackupRestore{
					Destinations: map[string]*kubermaticv1.BackupDestination{
						testDestination: {
							Endpoint:   "aws.s3.com",
							BucketName: "testbucket",
						},
					},
				}
			}),
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				test.GenDefaultCluster(),
				test.GenAdminUser("John", "john@acme.com", true),
			),
			ExistingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			BackupCredentials: func() *apiv2.BackupCredentials {
				cred := test.GenDefaultAPIBackupCredentials()
				cred.Destination = "not-here"
				return cred
			}(),
			ExpectedHTTPStatusCode: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			creds := struct {
				BackupCredentials *apiv2.BackupCredentials `json:"backup_credentials"`
			}{
				BackupCredentials: tc.BackupCredentials,
			}
			requestURL := fmt.Sprintf("/api/v2/seeds/%s/backupcredentials", tc.Seed.Name)
			body, err := json.Marshal(creds)
			if err != nil {
				t.Fatalf("failed marshalling backupcredentials: %v", err)
			}
			req := httptest.NewRequest(http.MethodPut, requestURL, bytes.NewBuffer(body))
			resp := httptest.NewRecorder()

			ep, clients, err := test.CreateTestEndpointAndGetClients(*tc.ExistingAPIUser, nil, tc.ExistingKubeObjects, nil, append(tc.ExistingKubermaticObjects, tc.Seed), nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}

			if resp.Code != http.StatusOK {
				return
			}

			secret := &corev1.Secret{}
			err = clients.FakeClient.Get(context.Background(), types.NamespacedName{
				Namespace: metav1.NamespaceSystem,
				Name:      backupcredentials.GenBackupCredentialsSecretName(tc.BackupCredentials.Destination, tc.Seed.GetEtcdBackupDestination(testDestination)),
			}, secret)
			if err != nil {
				t.Fatalf("Error getting backup credentials secret: %v", err)
			}
		})
	}
}
