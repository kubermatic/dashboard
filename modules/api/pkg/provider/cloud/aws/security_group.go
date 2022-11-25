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
	"errors"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"

	"k8s.io/utils/pointer"
)

// Get security group by aws generated id string (sg-xxxxx).
// Error is returned in case no such group exists.
func getSecurityGroupByID(ctx context.Context, client *ec2.Client, vpc *ec2types.Vpc, id string) (*ec2types.SecurityGroup, error) {
	if vpc == nil || vpc.VpcId == nil {
		return nil, errors.New("no valid VPC given")
	}

	dsgOut, err := client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{id},
		Filters:  []ec2types.Filter{ec2VPCFilter(pointer.StringDeref(vpc.VpcId, ""))},
	})
	if err != nil && !isNotFound(err) {
		return nil, fmt.Errorf("failed to get security group: %w", err)
	}

	if dsgOut == nil || len(dsgOut.SecurityGroups) == 0 {
		return nil, fmt.Errorf("security group with id '%s' not found in VPC %s", id, *vpc.VpcId)
	}

	return &dsgOut.SecurityGroups[0], nil
}
