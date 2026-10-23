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

package clustertemplate

import (
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
)

func TestGetApplicationsFromRequestPreservesNamespace(t *testing.T) {
	req := importClusterTemplateReq{}
	req.Body.Applications = []apiv1.Application{
		{
			ObjectMeta: apiv1.ObjectMeta{Name: "should-not-be-copied"},
			Namespace:  "apps",
			Spec:       apiv1.ApplicationSpec{},
		},
	}

	apps := req.getApplicationsFromRequest()

	if len(apps) != 1 {
		t.Fatalf("expected 1 application, got %d", len(apps))
	}
	if apps[0].Namespace != "apps" {
		t.Errorf("expected namespace %q, got %q", "apps", apps[0].Namespace)
	}
	if apps[0].Name != "" {
		t.Errorf("expected name to be dropped so GenerateCluster derives it, got %q", apps[0].Name)
	}
}
