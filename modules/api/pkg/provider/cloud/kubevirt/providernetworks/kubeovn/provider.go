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

package kubeovn

import (
	"context"
	"fmt"

	kubeovnv1 "github.com/kubeovn/kube-ovn/pkg/apis/kubeovn/v1"

	"k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt/providernetworks"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type kubeOVNProviderNetwork struct {
	client ctrlruntimeclient.Client
}

func New(client ctrlruntimeclient.Client) (providernetworks.ProviderNetwork, error) {
	return &kubeOVNProviderNetwork{client: client}, nil
}

func (k *kubeOVNProviderNetwork) ListVPCs(ctx context.Context) ([]providernetworks.VPC, error) {
	vpcList := &kubeovnv1.VpcList{}
	if err := k.client.List(ctx, vpcList); err != nil {
		return nil, fmt.Errorf("failed to list VPCs: %w", err)
	}

	vpcs := make([]providernetworks.VPC, 0, len(vpcList.Items))
	for _, vpc := range vpcList.Items {
		pVPC := providernetworks.VPC{
			Name: vpc.Name,
		}

		vpcs = append(vpcs, pVPC)
	}

	return vpcs, nil
}

func (k *kubeOVNProviderNetwork) ListVPCSubnets(ctx context.Context, vpcName string) ([]providernetworks.Subnet, error) {
	vpcSubnet := kubeovnv1.SubnetList{}
	if err := k.client.List(ctx, &vpcSubnet); err != nil {
		return nil, fmt.Errorf("failed to list VPC subnets: %w", err)
	}

	var subnets []providernetworks.Subnet
	for _, subnet := range vpcSubnet.Items {
		if subnet.Spec.Vpc == vpcName {
			pSubnet := providernetworks.Subnet{
				Name:       subnet.Name,
				CIDRBlock:  subnet.Spec.CIDRBlock,
				ExcludeIPs: subnet.Spec.ExcludeIps,
				GatewayIP:  subnet.Spec.Gateway,
			}

			subnets = append(subnets, pSubnet)
		}
	}

	return subnets, nil
}
