//go:build integration

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

package aws

import (
	"context"
	"os"
	"testing"
)

const (
	awsRegionEnvName = "AWS_REGION"
)

func getTestClientSet(ctx context.Context, t *testing.T) *ClientSet {
	endpoint := os.Getenv("AWS_TEST_ENDPOINT")
	if endpoint == "" {
		t.Skip("Skipping because $AWS_TEST_ENDPOINT is not set.")
	}

	cs, err := getClientSet(ctx, os.Getenv("AWS_ACCESS_KEY_ID"), os.Getenv("AWS_SECRET_ACCESS_KEY"), "", "", os.Getenv(awsRegionEnvName), endpoint)
	if err != nil {
		t.Fatalf("Failed to create AWS ClientSet: %v", err)
	}

	return cs
}
