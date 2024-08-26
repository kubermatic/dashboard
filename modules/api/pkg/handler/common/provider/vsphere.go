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

package provider

import (
	"context"
	"crypto/x509"
	"fmt"
	"net/http"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/cloud/vsphere"
	kubernetesprovider "k8c.io/dashboard/v2/pkg/provider/kubernetes"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

func VsphereNetworksWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID string, caBundle *x509.CertPool,
) (interface{}, error) {
	username, password, datacenterName, userInfo, err := getVsphereCredentialsAndDatacenterInfoFromCluster(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return GetVsphereNetworks(ctx, userInfo, seedsGetter, username, password, datacenterName, caBundle)
}

func VsphereFoldersWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID string, caBundle *x509.CertPool,
) (interface{}, error) {
	username, password, datacenterName, userInfo, err := getVsphereCredentialsAndDatacenterInfoFromCluster(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return GetVsphereFolders(ctx, userInfo, seedsGetter, username, password, datacenterName, caBundle)
}

func VsphereTagCategoriesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID string, caBundle *x509.CertPool,
) (interface{}, error) {
	username, password, datacenterName, userInfo, err := getVsphereCredentialsAndDatacenterInfoFromCluster(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return GetVsphereTagCategories(ctx, userInfo, seedsGetter, username, password, datacenterName, caBundle)
}

func VSphereTagsForTagCategoryWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID, tagCategory string, caBundle *x509.CertPool,
) (interface{}, error) {
	username, password, datacenterName, userInfo, err := getVsphereCredentialsAndDatacenterInfoFromCluster(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return GetVsphereTagsForTagCategory(ctx, userInfo, seedsGetter, username, password, datacenterName, tagCategory, caBundle)
}

func GetVsphereNetworks(ctx context.Context, userInfo *provider.UserInfo, seedsGetter provider.SeedsGetter, username, password, datacenterName string, caBundle *x509.CertPool) ([]apiv1.VSphereNetwork, error) {
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	networks, err := vsphere.GetNetworks(ctx, datacenter.Spec.VSphere, username, password, caBundle)
	if err != nil {
		return nil, err
	}

	var apiNetworks []apiv1.VSphereNetwork
	for _, net := range networks {
		apiNetworks = append(apiNetworks, apiv1.VSphereNetwork{
			Name:         net.Name,
			Type:         net.Type,
			RelativePath: net.RelativePath,
			AbsolutePath: net.AbsolutePath,
		})
	}

	return apiNetworks, nil
}

func GetVsphereTagCategories(ctx context.Context, userInfo *provider.UserInfo, seedsGetter provider.SeedsGetter, username, password, datacenterName string, caBundle *x509.CertPool) ([]apiv2.VSphereTagCategory, error) {
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	apiTagCategories, err := vsphere.GetTagCategories(ctx, datacenter.Spec.VSphere, username, password, caBundle)
	if err != nil {
		return nil, err
	}

	var tagCategories []apiv2.VSphereTagCategory
	for _, category := range apiTagCategories {
		tagCategories = append(tagCategories, apiv2.VSphereTagCategory{
			Name:   category.Name,
			ID:     category.ID,
			UsedBy: category.UsedBy,
		})
	}

	return tagCategories, nil
}

func GetVsphereTagsForTagCategory(ctx context.Context, userInfo *provider.UserInfo, seedsGetter provider.SeedsGetter, username, password, datacenterName, tagCategory string, caBundle *x509.CertPool) ([]apiv2.VSphereTag, error) {
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	apiTags, err := vsphere.GetTagsForCategory(ctx, datacenter.Spec.VSphere, username, password, tagCategory, caBundle)
	if err != nil {
		return nil, err
	}

	var tags []apiv2.VSphereTag
	for _, tag := range apiTags {
		tags = append(tags, apiv2.VSphereTag{
			Name:        tag.Name,
			ID:          tag.ID,
			UsedBy:      tag.UsedBy,
			Description: tag.Description,
			CategoryID:  tag.CategoryID,
		})
	}

	return tags, nil
}

func GetVsphereFolders(ctx context.Context, userInfo *provider.UserInfo, seedsGetter provider.SeedsGetter, username, password, datacenterName string, caBundle *x509.CertPool) ([]apiv1.VSphereFolder, error) {
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	folders, err := vsphere.GetVMFolders(ctx, datacenter.Spec.VSphere, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to get folders: %w", err)
	}

	var apiFolders []apiv1.VSphereFolder
	for _, folder := range folders {
		apiFolders = append(apiFolders, apiv1.VSphereFolder{Path: folder.Path})
	}

	return apiFolders, nil
}

func GetVsphereDatastoreList(ctx context.Context, userInfo *provider.UserInfo, seedsGetter provider.SeedsGetter, username, password,
	datacenterName string, caBundle *x509.CertPool) (*apiv1.VSphereDatastoreList, error) {
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	datastores, err := vsphere.GetDatastoreList(ctx, datacenter.Spec.VSphere, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to get datastore list: %w", err)
	}

	apiDatastores := &apiv1.VSphereDatastoreList{}
	for _, ds := range datastores {
		apiDatastores.Datastores = append(apiDatastores.Datastores, ds.InventoryPath)
	}

	return apiDatastores, nil
}

func GetVsphereVMGroupsList(ctx context.Context, userInfo *provider.UserInfo, seedsGetter provider.SeedsGetter, username, password,
	datacenterName string, caBundle *x509.CertPool) (*apiv1.VSphereVMGroupList, error) {
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	groups, err := vsphere.GetVMGroupsList(ctx, datacenter.Spec.VSphere, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to get VM Groups list against cluster %q: %w", datacenter.Spec.VSphere.Cluster, err)
	}

	apiVMGroups := &apiv1.VSphereVMGroupList{}
	for _, group := range groups {
		apiVMGroups.VMGroups = append(apiVMGroups.VMGroups, group.Name)
	}

	return apiVMGroups, nil
}

func getVsphereCredentialsAndDatacenterInfoFromCluster(ctx context.Context, userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID string,
) (string, string, string, *provider.UserInfo, error) {
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)
	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return "", "", "", nil, err
	}
	if cluster.Spec.Cloud.VSphere == nil {
		return "", "", "", nil, utilerrors.NewNotFound("cloud spec for ", clusterID)
	}

	datacenterName := cluster.Spec.Cloud.DatacenterName

	assertedClusterProvider, ok := clusterProvider.(*kubernetesprovider.ClusterProvider)
	if !ok {
		return "", "", "", nil, utilerrors.New(http.StatusInternalServerError, "failed to assert clusterProvider")
	}
	secretKeySelector := provider.SecretKeySelectorValueFuncFactory(ctx, assertedClusterProvider.GetSeedClusterAdminRuntimeClient())

	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return "", "", "", nil, common.KubernetesErrorToHTTPError(err)
	}
	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return "", "", "", nil, fmt.Errorf("failed to find Datacenter %q: %w", datacenterName, err)
	}

	username, password, err := vsphere.GetCredentialsForCluster(cluster.Spec.Cloud, secretKeySelector, datacenter.Spec.VSphere)
	if err != nil {
		return "", "", "", nil, err
	}

	return username, password, datacenterName, userInfo, nil
}
