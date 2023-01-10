/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

package externalcluster

import (
	"context"
	"encoding/json"
	"fmt"

	jsonpatch "github.com/evanphx/json-patch"

	clusterv1alpha1 "github.com/kubermatic/machine-controller/pkg/apis/cluster/v1alpha1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/sets"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func importKubeOneCluster(ctx context.Context, name string, userInfoGetter func(ctx context.Context, projectID string) (*provider.UserInfo, error), project *kubermaticv1.Project, cloud *apiv2.ExternalClusterCloudSpec, clusterProvider provider.ExternalClusterProvider, privilegedClusterProvider provider.PrivilegedExternalClusterProvider) (*kubermaticv1.ExternalCluster, error) {
	kubeOneCluster, err := DecodeManifestFromKubeOneReq(cloud.KubeOne.Manifest)
	if err != nil {
		return nil, err
	}

	isImported := resources.ExternalClusterIsImportedTrue
	newCluster := genExternalCluster(kubeOneCluster.Name, project.Name, isImported)
	newCluster.Spec.CloudSpec = kubermaticv1.ExternalClusterCloudSpec{
		KubeOne: &kubermaticv1.ExternalClusterKubeOneCloudSpec{},
	}

	kubermaticNamespace := resources.KubermaticNamespace
	err = clusterProvider.CreateOrUpdateKubeOneSSHSecret(ctx, kubermaticNamespace, cloud.KubeOne.SSHKey, newCluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	err = clusterProvider.CreateOrUpdateKubeOneManifestSecret(ctx, kubermaticNamespace, cloud.KubeOne.Manifest, newCluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	err = clusterProvider.CreateOrUpdateKubeOneCredentialSecret(ctx, kubermaticNamespace, *cloud.KubeOne.CloudSpec, newCluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	newCluster.Status.Condition.Phase = kubermaticv1.ExternalClusterPhaseProvisioning
	return createNewCluster(ctx, userInfoGetter, clusterProvider, privilegedClusterProvider, newCluster, project)
}

func patchKubeOneCluster(ctx context.Context,
	cluster *kubermaticv1.ExternalCluster,
	patchData json.RawMessage,
	secretKeySelector provider.SecretKeySelectorValueFunc,
	clusterProvider provider.ExternalClusterProvider,
	masterClient ctrlruntimeclient.Client) (*apiv2.ExternalCluster, error) {
	operation := cluster.Status.Condition.Phase
	if operation == kubermaticv1.ExternalClusterPhaseReconciling {
		return nil, utilerrors.NewBadRequest("Operation is not allowed: Another operation: (%s) is in progress, please wait for it to finish before starting a new operation.", operation)
	}

	clusterToPatchJSON, err := json.Marshal(cluster.Spec)
	if err != nil {
		return nil, utilerrors.NewBadRequest("cannot decode existing kubeone cluster: %v", err)
	}

	patchedClusterJSON, err := jsonpatch.MergePatch(clusterToPatchJSON, patchData)
	if err != nil {
		return nil, utilerrors.NewBadRequest("cannot patch kubeone cluster: %v", err)
	}
	var patchedClusterSpec *kubermaticv1.ExternalClusterSpec
	err = json.Unmarshal(patchedClusterJSON, &patchedClusterSpec)
	if err != nil {
		return nil, utilerrors.NewBadRequest("cannot decode patched settings: %v", err)
	}

	cluster.Spec = *patchedClusterSpec
	// currently only migration to containerd is supported
	desiredContainerRuntime := cluster.Spec.ContainerRuntime
	if !sets.NewString("containerd").Has(desiredContainerRuntime) {
		return nil, fmt.Errorf("Operation not supported: Only migration from docker to containerd is supported: %s", desiredContainerRuntime)
	}

	// ui warning
	// if upgradeVersion >= "1.24" {
	// 		return nil, utilerrors.NewBadRequest("container runtime is \"docker\". Support for docker will be removed with Kubernetes 1.24 release.")
	// 	}

	if err := masterClient.Update(ctx, cluster); err != nil {
		return nil, fmt.Errorf("failed to update kubeone external cluster %s: %w", cluster.Name, err)
	}

	return convertClusterToAPI(cluster), nil
}

func getKubeOneMachineDeployment(ctx context.Context, masterClient ctrlruntimeclient.Client, mdName string, cluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider) (*clusterv1alpha1.MachineDeployment, error) {
	machineDeployment := &clusterv1alpha1.MachineDeployment{}
	userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
	if err != nil {
		return nil, err
	}
	if err := userClusterClient.Get(ctx, types.NamespacedName{Name: mdName, Namespace: metav1.NamespaceSystem}, machineDeployment); err != nil && !meta.IsNoMatchError(err) {
		return nil, fmt.Errorf("failed to get MachineDeployment: %w", err)
	}
	return machineDeployment, nil
}

func getKubeOneMachineDeployments(ctx context.Context, masterClient ctrlruntimeclient.Client, cluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider) (*clusterv1alpha1.MachineDeploymentList, error) {
	mdList := &clusterv1alpha1.MachineDeploymentList{}
	userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
	if err != nil {
		return nil, err
	}
	if err := userClusterClient.List(ctx, mdList); err != nil {
		return nil, fmt.Errorf("failed to list MachineDeployment: %w", err)
	}
	return mdList, nil
}

func patchKubeOneMachineDeployment(ctx context.Context, masterClient ctrlruntimeclient.Client, machineDeployment *clusterv1alpha1.MachineDeployment, oldmd, newmd *apiv2.ExternalClusterMachineDeployment, cluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider) (*apiv2.ExternalClusterMachineDeployment, error) {
	currentVersion := oldmd.NodeDeployment.Spec.Template.Versions.Kubelet
	desiredVersion := newmd.NodeDeployment.Spec.Template.Versions.Kubelet
	if desiredVersion != currentVersion {
		machineDeployment.Spec.Template.Spec.Versions.Kubelet = desiredVersion
		userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
		if err != nil {
			return nil, err
		}
		if err := userClusterClient.Update(ctx, machineDeployment); err != nil && !meta.IsNoMatchError(err) {
			return nil, fmt.Errorf("failed to update MachineDeployment: %w", err)
		}
		return newmd, nil
	}

	currentReplicas := oldmd.NodeDeployment.Spec.Replicas
	desiredReplicas := newmd.NodeDeployment.Spec.Replicas
	if desiredReplicas != currentReplicas {
		machineDeployment.Spec.Replicas = &desiredReplicas
		userClusterClient, err := clusterProvider.GetClient(ctx, masterClient, cluster)
		if err != nil {
			return nil, err
		}
		if err := userClusterClient.Update(ctx, machineDeployment); err != nil && !meta.IsNoMatchError(err) {
			return nil, fmt.Errorf("failed to update MachineDeployment: %w", err)
		}
		return newmd, nil
	}

	return oldmd, nil
}

func getKubeOneAPIMachineDeployment(ctx context.Context,
	masterClient ctrlruntimeclient.Client,
	mdName string,
	cluster *kubermaticv1.ExternalCluster,
	clusterProvider provider.ExternalClusterProvider) (*apiv2.ExternalClusterMachineDeployment, error) {
	md, err := getKubeOneMachineDeployment(ctx, masterClient, mdName, cluster, clusterProvider)
	if err != nil {
		return nil, err
	}
	nd, err := handlercommon.OutputMachineDeployment(md)
	if err != nil {
		return nil, err
	}

	return &apiv2.ExternalClusterMachineDeployment{NodeDeployment: *nd}, nil
}

func getKubeOneAPIMachineDeployments(ctx context.Context,
	masterClient ctrlruntimeclient.Client,
	cluster *kubermaticv1.ExternalCluster,
	clusterProvider provider.ExternalClusterProvider) ([]apiv2.ExternalClusterMachineDeployment, error) {
	mdList, err := getKubeOneMachineDeployments(ctx, masterClient, cluster, clusterProvider)
	nodeDeployments := make([]apiv2.ExternalClusterMachineDeployment, 0, len(mdList.Items))
	if err != nil {
		return nil, err
	}

	for _, md := range mdList.Items {
		nd, err := handlercommon.OutputMachineDeployment(&md)
		if err != nil {
			return nil, fmt.Errorf("failed to output machine deployment %s: %w", md.Name, err)
		}
		nodeDeployments = append(nodeDeployments, apiv2.ExternalClusterMachineDeployment{NodeDeployment: *nd})
	}

	return nodeDeployments, nil
}
