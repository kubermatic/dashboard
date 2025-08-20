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

package common

import (
	"context"
	"fmt"
	"net/http"

	semverlib "github.com/Masterminds/semver/v3"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	kubermaticv1helper "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1/helper"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
	"k8c.io/kubermatic/v2/pkg/validation/nodeupdate"
	"k8c.io/kubermatic/v2/pkg/version"
	clusterversion "k8c.io/kubermatic/v2/pkg/version/cluster"
	clusterv1alpha1 "k8c.io/machine-controller/sdk/apis/cluster/v1alpha1"

	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func GetUpgradesEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectID, clusterID string, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, configGetter provider.KubermaticConfigurationGetter) (interface{}, error) {
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)

	cluster, err := GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, nil)
	if err != nil {
		return nil, err
	}

	client, err := common.GetClusterClient(ctx, userInfoGetter, clusterProvider, cluster, projectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	machineDeployments := &clusterv1alpha1.MachineDeploymentList{}
	if err := client.List(ctx, machineDeployments, ctrlruntimeclient.InNamespace(metav1.NamespaceSystem)); err != nil {
		// Happens during cluster creation when the CRD is not setup yet
		if meta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	providerName, err := kubermaticv1helper.ClusterCloudProviderName(cluster.Spec.Cloud)
	if err != nil {
		return nil, fmt.Errorf("failed to get the cloud provider name: %w", err)
	}

	config, err := configGetter(ctx)
	if err != nil {
		return nil, err
	}

	versionManager := version.NewFromConfiguration(config)

	versions, err := versionManager.GetPossibleUpdates(cluster.Spec.Version.String(), kubermaticv1.ProviderType(providerName), clusterversion.GetVersionConditions(&cluster.Spec)...)
	if err != nil {
		return nil, err
	}

	upgrades := make([]*apiv1.MasterVersion, 0)
	for _, v := range versions {
		isRestricted, err := isRestrictedByKubeletVersions(v, machineDeployments.Items)
		if err != nil {
			return nil, err
		}
		upgrades = append(upgrades, &apiv1.MasterVersion{
			Version:                    v.Version,
			RestrictedByKubeletVersion: isRestricted,
		})
	}

	return upgrades, nil
}

func UpgradeNodeDeploymentsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectID, clusterID string, version apiv1.MasterVersion, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)

	cluster, err := GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, nil)
	if err != nil {
		return nil, err
	}

	requestedKubeletVersion, err := semverlib.NewVersion(version.Version.String())
	if err != nil {
		return nil, utilerrors.NewBadRequest("%v", err)
	}

	if err = nodeupdate.EnsureVersionCompatible(cluster.Spec.Version.Semver(), requestedKubeletVersion); err != nil {
		return nil, utilerrors.NewBadRequest("%v", err)
	}

	client, err := clusterProvider.GetAdminClientForUserCluster(ctx, cluster)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	machineDeployments := &clusterv1alpha1.MachineDeploymentList{}
	if err := client.List(ctx, machineDeployments, ctrlruntimeclient.InNamespace(metav1.NamespaceSystem)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	var updateErrors []string
	for _, machineDeployment := range machineDeployments.Items {
		machineDeployment.Spec.Template.Spec.Versions.Kubelet = version.Version.String()
		if err := client.Update(ctx, &machineDeployment); err != nil {
			updateErrors = append(updateErrors, err.Error())
		}
	}

	if len(updateErrors) > 0 {
		return nil, utilerrors.NewWithDetails(http.StatusInternalServerError, "failed to update some node deployments", updateErrors)
	}

	return nil, nil
}

func isRestrictedByKubeletVersions(controlPlaneVersion *version.Version, mds []clusterv1alpha1.MachineDeployment) (bool, error) {
	for _, md := range mds {
		kubeletVersion, err := semverlib.NewVersion(md.Spec.Template.Spec.Versions.Kubelet)
		if err != nil {
			return false, err
		}

		if err = nodeupdate.EnsureVersionCompatible(controlPlaneVersion.Version, kubeletVersion); err != nil {
			return true, nil
		}
	}
	return false, nil
}

func GetKubeOneUpgradesEndpoint(ctx context.Context, masterClient ctrlruntimeclient.Client, externalCluster *kubermaticv1.ExternalCluster, clusterProvider provider.ExternalClusterProvider, configGetter provider.KubermaticConfigurationGetter) (interface{}, error) {
	providerName := externalCluster.Spec.CloudSpec.KubeOne.ProviderName
	providerType := kubermaticv1.ProviderType(providerName)

	currentVersion, err := clusterProvider.GetVersion(ctx, masterClient, externalCluster)
	if err != nil {
		return nil, err
	}
	config, err := configGetter(ctx)
	if err != nil {
		return nil, err
	}

	versionManager := version.NewFromConfiguration(config)

	versions, err := versionManager.GetKubeOnePossibleUpdates(currentVersion.String(), providerType)
	if err != nil {
		return nil, err
	}
	upgrades := make([]*apiv1.MasterVersion, 0)
	for _, v := range versions {
		upgrades = append(upgrades, &apiv1.MasterVersion{
			Version: v.Version,
		})
	}

	return upgrades, nil
}
