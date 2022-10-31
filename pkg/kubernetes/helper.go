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

package kubernetes

import (
	"context"
	"fmt"
	"strings"

	"k8c.io/dashboard/v2/pkg/provider"

	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
)

const (
	// NodeControlPlaneLabel is the label on kubernetes control plane nodes.
	NodeControlPlaneLabel = "node-role.kubernetes.io/control-plane"
)

func CheckContainerRuntime(ctx context.Context,
	externalCluster *kubermaticv1.ExternalCluster,
	externalClusterProvider provider.ExternalClusterProvider,
) (string, error) {
	nodes, err := externalClusterProvider.ListNodes(ctx, externalCluster)
	if err != nil {
		return "", fmt.Errorf("failed to fetch container runtime: not able to list nodes %w", err)
	}
	for _, node := range nodes.Items {
		if _, ok := node.Labels[NodeControlPlaneLabel]; ok {
			containerRuntimeVersion := node.Status.NodeInfo.ContainerRuntimeVersion
			strSlice := strings.Split(containerRuntimeVersion, ":")
			for _, containerRuntime := range strSlice {
				return containerRuntime, nil
			}
		}
	}
	return "", fmt.Errorf("failed to fetch container runtime: no control plane nodes found with label %s", NodeControlPlaneLabel)
}
