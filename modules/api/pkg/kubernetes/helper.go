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

	"github.com/pkg/errors"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/utils/ptr"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	// NodeControlPlaneLabel is the label on kubernetes control plane nodes.
	NodeControlPlaneLabel = "node-role.kubernetes.io/control-plane"
)

func ListControlPlaneNode(ctx context.Context, clusterClient ctrlruntimeclient.Client, limit *int64) (*corev1.NodeList, error) {
	nodeReq, err := labels.NewRequirement(NodeControlPlaneLabel, selection.Exists, []string{})
	if err != nil {
		return nil, errors.Wrap(err, "error creating selector requirement")
	}

	selector := labels.NewSelector().Add(*nodeReq)
	if err != nil {
		return nil, errors.Wrap(err, "error converting node label requirement to selector")
	}

	var listOpts ctrlruntimeclient.ListOption
	nodes := &corev1.NodeList{}
	if limit != nil {
		listOpts = &ctrlruntimeclient.ListOptions{
			Limit:         *limit,
			LabelSelector: selector,
		}
	} else {
		listOpts = &ctrlruntimeclient.ListOptions{
			LabelSelector: selector,
		}
	}

	err = clusterClient.List(ctx, nodes, listOpts)
	if err != nil {
		return nil, err
	}
	return nodes, nil
}

func GetContainerRuntime(ctx context.Context,
	masterClient ctrlruntimeclient.Client,
	externalCluster *kubermaticv1.ExternalCluster,
	externalClusterProvider provider.ExternalClusterProvider,
) (string, error) {
	clusterClient, err := externalClusterProvider.GetClient(ctx, masterClient, externalCluster)
	if err != nil {
		return "", err
	}

	controlPlaneNode, err := ListControlPlaneNode(ctx, clusterClient, ptr.To[int64](1))
	if err != nil {
		return "", fmt.Errorf("failed to list control plane nodes %w", err)
	}

	for len(controlPlaneNode.Items) > 0 {
		containerRuntimeVersion := controlPlaneNode.Items[0].Status.NodeInfo.ContainerRuntimeVersion
		containerRuntime, _, found := strings.Cut(containerRuntimeVersion, ":")
		if found {
			return containerRuntime, nil
		}
	}
	return "", fmt.Errorf("failed to get container runtime from node")
}
