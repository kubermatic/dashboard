/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package kubernetes_test

import (
	"context"
	"encoding/json"
	"testing"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	"k8c.io/kubermatic/v2/pkg/test/fake"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	restclient "k8s.io/client-go/rest"
	"k8s.io/utils/ptr"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

func genKubermaticConfiguration() *kubermaticv1.KubermaticConfiguration {
	return &kubermaticv1.KubermaticConfiguration{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "kubermatic",
			Namespace: resources.KubermaticNamespace,
		},
		Spec: kubermaticv1.KubermaticConfigurationSpec{
			Ingress: kubermaticv1.KubermaticIngressConfiguration{Domain: "kkp.example.com"},
		},
	}
}

func eventRateLimitPlugins() apiv2.AdmissionPluginsConfiguration {
	return apiv2.AdmissionPluginsConfiguration{
		AdmissionPluginsConfiguration: kubermaticv1.AdmissionPluginsConfiguration{
			EventRateLimit: &kubermaticv1.EventRateLimitPluginConfiguration{
				Enabled:  ptr.To(true),
				Enforced: ptr.To(false),
			},
		},
	}
}

func newUserClusterConfigProvider(client ctrlruntimeclient.Client) *kubernetes.UserClusterConfigProvider {
	impersonationClient := func(restclient.ImpersonationConfig) (ctrlruntimeclient.Client, error) {
		return client, nil
	}
	return kubernetes.NewUserClusterConfigProvider(impersonationClient, client)
}

// TestUpdateAdmissionPluginsConfigurationSendsOnlyChangedFields checks the request body, since fields
// unknown to this API's KubermaticConfiguration type (e.g. from a newer KKP) cannot be stored in the
// typed fake client: only fields that the request carries can be overwritten on the apiserver.
func TestUpdateAdmissionPluginsConfigurationSendsOnlyChangedFields(t *testing.T) {
	var patchBody []byte
	client := fake.NewClientBuilder().
		WithObjects(genKubermaticConfiguration()).
		WithInterceptorFuncs(interceptor.Funcs{
			Update: func(ctx context.Context, c ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, opts ...ctrlruntimeclient.UpdateOption) error {
				t.Fatal("the KubermaticConfiguration must be patched, an update drops unknown fields")
				return nil
			},
			Patch: func(ctx context.Context, c ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, patch ctrlruntimeclient.Patch, opts ...ctrlruntimeclient.PatchOption) error {
				var err error
				if patchBody, err = patch.Data(obj); err != nil {
					return err
				}
				return c.Patch(ctx, obj, patch, opts...)
			},
		}).
		Build()

	plugins, err := newUserClusterConfigProvider(client).UpdateAdmissionPluginsConfiguration(context.Background(), &provider.UserInfo{IsAdmin: true}, eventRateLimitPlugins())
	if err != nil {
		t.Fatalf("failed to update the admission plugins: %v", err)
	}
	if plugins.EventRateLimit == nil || !*plugins.EventRateLimit.Enabled {
		t.Fatalf("expected EventRateLimit to be enabled, got %+v", plugins)
	}

	var body struct {
		Metadata map[string]json.RawMessage            `json:"metadata"`
		Spec     map[string]map[string]json.RawMessage `json:"spec"`
	}
	if err := json.Unmarshal(patchBody, &body); err != nil {
		t.Fatalf("failed to decode the patch %s: %v", patchBody, err)
	}
	var topLevel map[string]json.RawMessage
	if err := json.Unmarshal(patchBody, &topLevel); err != nil {
		t.Fatalf("failed to decode the patch %s: %v", patchBody, err)
	}
	onlyKey := func(m map[string]json.RawMessage, key string) bool {
		_, ok := m[key]
		return ok && len(m) == 1
	}
	if len(topLevel) != 2 || !onlyKey(body.Metadata, "resourceVersion") || len(body.Spec) != 1 || !onlyKey(body.Spec["userCluster"], "admissionPlugins") {
		t.Fatalf("expected the patch to carry only metadata.resourceVersion and spec.userCluster.admissionPlugins, got %s", patchBody)
	}

	stored := &kubermaticv1.KubermaticConfiguration{}
	if err := client.Get(context.Background(), ctrlruntimeclient.ObjectKeyFromObject(genKubermaticConfiguration()), stored); err != nil {
		t.Fatalf("failed to get the KubermaticConfiguration: %v", err)
	}
	if stored.Spec.Ingress.Domain != "kkp.example.com" {
		t.Errorf("expected the other spec fields to stay, got domain %q", stored.Spec.Ingress.Domain)
	}
	if stored.Spec.UserCluster.AdmissionPlugins == nil || !*stored.Spec.UserCluster.AdmissionPlugins.EventRateLimit.Enabled {
		t.Errorf("expected the stored EventRateLimit to be enabled, got %+v", stored.Spec.UserCluster.AdmissionPlugins)
	}
}

func TestUpdateAdmissionPluginsConfigurationConflictsWithConcurrentWrite(t *testing.T) {
	client := fake.NewClientBuilder().
		WithObjects(genKubermaticConfiguration()).
		WithInterceptorFuncs(interceptor.Funcs{
			Patch: func(ctx context.Context, c ctrlruntimeclient.WithWatch, obj ctrlruntimeclient.Object, patch ctrlruntimeclient.Patch, opts ...ctrlruntimeclient.PatchOption) error {
				// another writer changes the object between the read and the patch
				concurrent := &kubermaticv1.KubermaticConfiguration{}
				if err := c.Get(ctx, ctrlruntimeclient.ObjectKeyFromObject(obj), concurrent); err != nil {
					return err
				}
				concurrent.Spec.Ingress.Domain = "other.example.com"
				if err := c.Update(ctx, concurrent); err != nil {
					return err
				}
				return c.Patch(ctx, obj, patch, opts...)
			},
		}).
		Build()

	_, err := newUserClusterConfigProvider(client).UpdateAdmissionPluginsConfiguration(context.Background(), &provider.UserInfo{IsAdmin: true}, eventRateLimitPlugins())
	if !apierrors.IsConflict(err) {
		t.Fatalf("expected a conflict error, got %v", err)
	}
}
