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
	"path/filepath"
	"runtime"
	"testing"

	"go.uber.org/zap"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/dex"
)

func TestOIDCClientIDExistsInDexValues(t *testing.T) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("failed to determine test file location")
	}

	valuesFile := filepath.Join(filepath.Dir(filename), "..", "..", "..", "..", "..", "..", "hack", "ci", "testdata", "dex_values.yaml")
	if _, err := dex.NewClientFromHelmValues(valuesFile, oidcClientID, zap.NewNop().Sugar()); err != nil {
		t.Fatalf("failed to load OIDC client %q from Dex values: %v", oidcClientID, err)
	}
}
