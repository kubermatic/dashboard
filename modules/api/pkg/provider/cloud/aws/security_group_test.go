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
	"testing"
)

func TestGetSecurityGroupByID(t *testing.T) {
	ctx := context.Background()
	cs := getTestClientSet(ctx, t)

	defaultVPC, err := getDefaultVPC(ctx, cs.EC2)
	if err != nil {
		t.Fatalf("getDefaultVPC should not have errored, but returned %v", err)
	}

	t.Run("invalid-vpc-invalid-sg", func(t *testing.T) {
		if _, err := getSecurityGroupByID(ctx, cs.EC2, nil, "does-not-exist"); err == nil {
			t.Fatalf("getSecurityGroupByID should have errored, but returned %v", err)
		}
	})

	t.Run("valid-vpc-invalid-sg", func(t *testing.T) {
		if _, err := getSecurityGroupByID(ctx, cs.EC2, defaultVPC, "does-not-exist"); err == nil {
			t.Fatalf("getSecurityGroupByID should have errored, but returned %v", err)
		}
	})
}
