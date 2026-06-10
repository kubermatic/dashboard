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

package utils

import (
	"os"
	"path/filepath"
	"testing"

	"go.uber.org/zap"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/dex"
)

func TestOIDCClientIDExistsInDexValues(t *testing.T) {
	valuesFile := dexValuesFile(t)
	if _, err := dex.NewClientFromHelmValues(valuesFile, oidcClientID, zap.NewNop().Sugar()); err != nil {
		t.Fatalf("failed to load OIDC client %q from Dex values: %v", oidcClientID, err)
	}
}

func dexValuesFile(t *testing.T) string {
	t.Helper()

	dir, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to determine working directory: %v", err)
	}

	for {
		valuesFile := filepath.Join(dir, "hack", "ci", "testdata", "dex_values.yaml")
		if _, err := os.Stat(valuesFile); err == nil {
			return valuesFile
		} else if !os.IsNotExist(err) {
			t.Fatalf("failed to stat Dex values file %q: %v", valuesFile, err)
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			t.Fatalf("failed to find hack/ci/testdata/dex_values.yaml from %q", dir)
		}

		dir = parent
	}
}
