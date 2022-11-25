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

	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
)

func newCloudProvider(t *testing.T) *AmazonEC2 {
	ctx := context.Background()
	cs := getTestClientSet(ctx, t)

	provider, err := NewCloudProvider(&kubermaticv1.Datacenter{
		Spec: kubermaticv1.DatacenterSpec{
			AWS: &kubermaticv1.DatacenterSpecAWS{
				Region: os.Getenv(awsRegionEnvName),
			},
		},
	}, nil)
	if err != nil {
		t.Fatalf("failed to create cloud provider: %v", err)
	}

	provider.clientSet = cs

	return provider
}

func TestValidateCloudSpec(t *testing.T) {
	provider := newCloudProvider(t)
	ctx := context.Background()

	defaultVPC, err := getDefaultVPC(ctx, provider.clientSet.EC2)
	if err != nil {
		t.Fatalf("getDefaultVPC should not have errored, but returned %v", err)
	}

	defaultVPCID := *defaultVPC.VpcId

	// to properly test, we need the ID of a pre-existing security group
	sGroups, err := getSecurityGroupsWithClient(ctx, provider.clientSet.EC2)
	if err != nil {
		t.Fatalf("getSecurityGroupsWithClient should not have errored, but returned %v", err)
	}
	if len(sGroups) == 0 {
		t.Fatal("getSecurityGroupsWithClient should have found at least one security group")
	}

	securityGroupID := *sGroups[0].GroupId

	// NB: Remember that ValidateCloudSpec is not for validations
	// during regular reconciliations, but it is used to validate
	// the spec when a user creates a new cluster. That is why for
	// example a VPC ID must be given if a SG ID is given, because
	// at this point we never reconciled and have to rely solely on
	// the user input.

	testcases := []struct {
		name      string
		cloudSpec *kubermaticv1.AWSCloudSpec
		expectErr bool
	}{
		{
			name:      "empty-spec",
			cloudSpec: &kubermaticv1.AWSCloudSpec{},
			expectErr: false,
		},
		{
			name: "valid-vpc-id",
			cloudSpec: &kubermaticv1.AWSCloudSpec{
				VPCID: defaultVPCID,
			},
			expectErr: false,
		},
		{
			name: "valid-vpc-and-group",
			cloudSpec: &kubermaticv1.AWSCloudSpec{
				VPCID:           defaultVPCID,
				SecurityGroupID: securityGroupID,
			},
			expectErr: false,
		},
		{
			name: "invalid-vpc-id",
			cloudSpec: &kubermaticv1.AWSCloudSpec{
				VPCID: "does-not-exist",
			},
			expectErr: true,
		},
		{
			name: "no-vpc-given-but-required",
			cloudSpec: &kubermaticv1.AWSCloudSpec{
				SecurityGroupID: "does-not-exist",
			},
			expectErr: true,
		},
		{
			name: "valid-vpc-but-invalid-security-group",
			cloudSpec: &kubermaticv1.AWSCloudSpec{
				VPCID:           defaultVPCID,
				SecurityGroupID: "does-not-exist",
			},
			expectErr: true,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			err := provider.ValidateCloudSpec(ctx, kubermaticv1.CloudSpec{AWS: testcase.cloudSpec})
			if (err != nil) != testcase.expectErr {
				if testcase.expectErr {
					t.Error("Expected spec to fail, but no error was returned.")
				} else {
					t.Errorf("Expected spec to be valid, but error was returned: %v", err)
				}
			}
		})
	}
}
