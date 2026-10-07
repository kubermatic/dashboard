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

package v1

import (
	"encoding/json"
	"testing"

	apiv1 "k8c.io/kubermatic/sdk/v2/api/v1"
)

// TestApplicationNamespaceRoundTrip guards the contract between the dashboard API and
// KKP's initial-application-installation-controller: the ApplicationInstallation namespace
// sent by the UI on cluster creation must survive decoding into the dashboard type and be
// readable by the KKP SDK type that the seed controller unmarshals the annotation into.
func TestApplicationNamespaceRoundTrip(t *testing.T) {
	const payload = `{
		"cluster": {"name": "test"},
		"applications": [{
			"name": "my-app",
			"namespace": "apps",
			"spec": {
				"applicationRef": {"name": "my-app", "version": "1.0.0"},
				"namespace": {"name": "my-app", "create": true}
			}
		}]
	}`

	var body CreateClusterSpec
	if err := json.Unmarshal([]byte(payload), &body); err != nil {
		t.Fatalf("failed to decode CreateClusterSpec: %v", err)
	}
	if len(body.Applications) != 1 {
		t.Fatalf("expected 1 application, got %d", len(body.Applications))
	}
	if got := body.Applications[0].Namespace; got != "apps" {
		t.Fatalf("dashboard type dropped application namespace: expected %q, got %q", "apps", got)
	}

	// This mirrors what the create-cluster handler writes into the
	// kubermatic.io/initial-application-installations-request annotation.
	annotation, err := json.Marshal(body.Applications)
	if err != nil {
		t.Fatalf("failed to marshal applications: %v", err)
	}

	// apiv1 here is the KKP SDK package, not this (dashboard) package.
	var kkpApps []apiv1.Application
	if err := json.Unmarshal(annotation, &kkpApps); err != nil {
		t.Fatalf("KKP SDK failed to decode annotation: %v", err)
	}
	if got := kkpApps[0].Namespace; got != "apps" {
		t.Fatalf("KKP SDK did not receive application namespace: expected %q, got %q", "apps", got)
	}
	if got := kkpApps[0].Spec.Namespace.Name; got != "my-app" {
		t.Fatalf("spec.namespace.name changed unexpectedly: expected %q, got %q", "my-app", got)
	}
}
