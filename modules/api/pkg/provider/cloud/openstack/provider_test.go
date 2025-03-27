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

package openstack

import (
	"reflect"
	"testing"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	"k8c.io/kubermatic/v2/pkg/resources/test"
	providerconfig "k8c.io/machine-controller/pkg/providerconfig/types"

	corev1 "k8s.io/api/core/v1"
)

func TestGetCredentialsForCluster(t *testing.T) {
	tests := []struct {
		name    string
		spec    *kubermaticv1.OpenstackCloudSpec
		mock    func(configVar *providerconfig.GlobalSecretKeySelector, key string) (string, error)
		want    *resources.OpenstackCredentials
		wantErr bool
	}{
		// there are 3 kinds of auth mode for openstack which are mutually exclusive
		//   * domain + token
		//   * ApplicationCredential (ApplicationCredentialID and ApplicationCredentialSecret)
		//   * domain + user (ie  Username, Password, (Project or Tenant) and (ProjectID or tenantID))
		{
			name:    "valid spec with values - auth with token",
			spec:    &kubermaticv1.OpenstackCloudSpec{Domain: "domain", Token: "the_token", UseToken: true},
			mock:    test.ShouldNotBeCalled,
			want:    &resources.OpenstackCredentials{Domain: "domain", Token: "the_token"},
			wantErr: false,
		},
		{
			name:    "valid spec with values - auth with user with project",
			spec:    &kubermaticv1.OpenstackCloudSpec{Domain: "domain", ApplicationCredentialID: "", Username: "user", Password: "pass", Project: "the_project", ProjectID: "the_project_id"},
			mock:    test.ShouldNotBeCalled,
			want:    &resources.OpenstackCredentials{Username: "user", Password: "pass", Project: "the_project", ProjectID: "the_project_id", Domain: "domain", ApplicationCredentialID: "", ApplicationCredentialSecret: ""},
			wantErr: false,
		},
		{
			name:    "valid spec with values - auth with applicationCredential",
			spec:    &kubermaticv1.OpenstackCloudSpec{ApplicationCredentialID: "app_id", ApplicationCredentialSecret: "app_secret"},
			mock:    test.ShouldNotBeCalled,
			want:    &resources.OpenstackCredentials{ApplicationCredentialID: "app_id", ApplicationCredentialSecret: "app_secret"},
			wantErr: false,
		},
		{
			name:    "valid spec with CredentialsReference - auth with token",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "the_token", resources.OpenstackApplicationCredentialID: ""}),
			want:    &resources.OpenstackCredentials{Domain: "domain-value", Token: "the_token"},
			wantErr: false,
		},
		{
			name:    "valid spec with CredentialsReference - auth with user with project",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackProject: "the_project", resources.OpenstackProjectID: "the_project_id"}),
			want:    &resources.OpenstackCredentials{Username: "username-value", Password: "password-value", Project: "the_project", ProjectID: "the_project_id", Domain: "domain-value", ApplicationCredentialID: "", ApplicationCredentialSecret: ""},
			wantErr: false,
		},
		{
			name:    "valid spec with CredentialsReference - auth with user with tenant( when project not defined it should fallback to tenant)",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackProject: test.MissingKeyErr(resources.OpenstackProject), resources.OpenstackProjectID: test.MissingKeyErr(resources.OpenstackProjectID), resources.OpenstackTenant: "the_tenant", resources.OpenstackTenantID: "the_tenant_id"}),
			want:    &resources.OpenstackCredentials{Username: "username-value", Password: "password-value", Project: "the_tenant", ProjectID: "the_tenant_id", Domain: "domain-value", ApplicationCredentialID: "", ApplicationCredentialSecret: ""},
			wantErr: false,
		},
		{
			name:    "valid spec with CredentialsReference - auth with applicationCredential",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: ""}),
			want:    &resources.OpenstackCredentials{ApplicationCredentialID: "applicationCredentialID-value", ApplicationCredentialSecret: "applicationCredentialSecret-value"},
			wantErr: false,
		},

		{
			name:    "invalid spec CredentialsReference - missing Domain",
			spec:    &kubermaticv1.OpenstackCloudSpec{CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackDomain: test.MissingKeyErr(resources.OpenstackDomain)}),
			want:    &resources.OpenstackCredentials{},
			wantErr: true,
		},
		{
			name:    "invalid spec CredentialsReference - missing ApplicationCredentialSecret",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "applicationCredentialID-value", resources.OpenstackApplicationCredentialSecret: test.MissingKeyErr(resources.OpenstackApplicationCredentialSecret)}),
			want:    &resources.OpenstackCredentials{},
			wantErr: true,
		},
		{
			name:    "invalid spec CredentialsReference - missing username",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackUsername: test.MissingKeyErr(resources.OpenstackUsername)}),
			want:    &resources.OpenstackCredentials{},
			wantErr: true,
		},
		{
			name:    "invalid spec CredentialsReference - missing password",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackPassword: test.MissingKeyErr(resources.OpenstackPassword)}),
			want:    &resources.OpenstackCredentials{},
			wantErr: true,
		},
		{
			name:    "invalid spec CredentialsReference - missing Project and tenant",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackProject: test.MissingKeyErr(resources.OpenstackProject), resources.OpenstackTenant: test.MissingKeyErr(resources.OpenstackTenant)}),
			want:    &resources.OpenstackCredentials{},
			wantErr: true,
		},
		{
			name:    "invalid spec CredentialsReference - missing ProjectID and tenantID",
			spec:    &kubermaticv1.OpenstackCloudSpec{UseToken: false, CredentialsReference: &providerconfig.GlobalSecretKeySelector{ObjectReference: corev1.ObjectReference{Name: "the-secret", Namespace: "default"}, Key: "data"}},
			mock:    test.DefaultOrOverride(map[string]interface{}{resources.OpenstackToken: "", resources.OpenstackApplicationCredentialID: "", resources.OpenstackProjectID: test.MissingKeyErr(resources.OpenstackProjectID), resources.OpenstackTenantID: test.MissingKeyErr(resources.OpenstackTenantID)}),
			want:    &resources.OpenstackCredentials{},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetCredentialsForCluster(kubermaticv1.CloudSpec{Openstack: tt.spec}, tt.mock)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetCredentialsForCluster() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetCredentialsForCluster() got = %v, want %v", got, tt.want)
			}
		})
	}
}
