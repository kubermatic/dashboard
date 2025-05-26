/*
Copyright 2024 The Kubermatic Kubernetes Platform contributors.

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

package kubevirt

import (
	"context"
	"fmt"

	"k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt/providernetworks/kubeovn"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func GetProviderNetworkVPCs(ctx context.Context, client ctrlruntimeclient.Client) ([]string, error) {
	ovnProvider, err := kubeovn.New(client)
	if err != nil {
		return nil, nil
	}

	vpcs, err := ovnProvider.ListVPCs(ctx)
	if err != nil {
		return nil, err
	}

	vpcNames := make([]string, 0, len(vpcs))
	for _, vpc := range vpcs {
		vpcNames = append(vpcNames, vpc.Name)
	}

	return vpcNames, nil
}

func GetProviderNetworkSubnets(ctx context.Context, client ctrlruntimeclient.Client, vpcName string) ([]string, error) {
	ovnProvider, err := kubeovn.New(client)
	if err != nil {
		return nil, nil
	}

	subs, err := ovnProvider.ListVPCSubnets(ctx, vpcName)
	if err != nil {
		return nil, err
	}

	subnets := make([]string, 0, len(subs))
	for _, subnet := range subs {
		subnetName := fmt.Sprintf("%v (%v)", subnet.Name, subnet.CIDRBlock)
		subnets = append(subnets, subnetName)
	}

	return subnets, nil
}
