//go:build ee

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

package storagelocation

import (
	"context"
	"net/http"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	storagelocation "k8c.io/dashboard/v2/pkg/ee/clusterbackup/storage-location"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) ([]*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.ListCBSL(ctx, request, userInfoGetter, provider, projectProvider)
}

func getCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.GetCSBL(ctx, request, userInfoGetter, provider, projectProvider)
}

func listCBSLBucketObjects(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (apiv2.BackupStorageLocationBucketObjectList, error) {
	return storagelocation.ListCSBLBucketObjects(ctx, request, userInfoGetter, provider, projectProvider)
}

func createCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.CreateCBSL(ctx, request, userInfoGetter, provider, projectProvider)
}

func deleteCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) error {
	return storagelocation.DeleteCBSL(ctx, request, userInfoGetter, provider, projectProvider)
}

func patchCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.PatchCBSL(ctx, request, userInfoGetter, provider, projectProvider)
}

func DecodeListProjectCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeListProjectCBSLReq(ctx, r)
}

func DecodeGetCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeGetCBSLReq(ctx, r)
}

func DecodeListCBSLBucketObjectsReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeListCBSLBucketObjectsReq(ctx, r)
}

func DecodeCreateCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeCreateCBSLReq(ctx, r)
}

func DecodeDeleteCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeDeleteCBSLReq(ctx, r)
}

func DecodePatchCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodePatchCBSLReq(ctx, r)
}
