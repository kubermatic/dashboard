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

package machine_test

import (
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/machine"
)

func TestCredentialEndpoint(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		name           string
		distribution   *apiv1.OperatingSystemSpec
		cloudProvider  *apiv1.NodeCloudSpec
		expectedResult string
	}{
		{
			name: "test SSH login name for AWS:Ubuntu",
			distribution: &apiv1.OperatingSystemSpec{
				Ubuntu: &apiv1.UbuntuSpec{DistUpgradeOnBoot: false},
			},

			cloudProvider: &apiv1.NodeCloudSpec{
				AWS: &apiv1.AWSNodeSpec{},
			},
			expectedResult: "ubuntu",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			resultLoginName, err := machine.GetSSHUserName(tc.distribution, tc.cloudProvider)
			if err != nil {
				t.Fatal(err)
			}
			if tc.expectedResult != resultLoginName {
				t.Fatalf("expected %s got %s", tc.expectedResult, resultLoginName)
			}
		})
	}
}
