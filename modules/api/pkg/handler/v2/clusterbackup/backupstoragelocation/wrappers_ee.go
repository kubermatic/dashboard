//go:build ee

/*
Copyright 2025 The Kubermatic Kubernetes Platform contributors.

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

package backupstoragelocation

import (
	"context"
	"net/http"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/ee/clusterbackup/backupstoragelocation"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, backupProvider provider.BackupStorageProvider, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (*apiv2.BackupStorageLocation, error) {
	return backupstoragelocation.CreateBSLEndpoint(ctx, req, userInfoGetter, backupProvider, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeCreateBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeCreateBSLReq(c, r)
}

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) ([]*apiv2.BackupStorageLocation, error) {
	return backupstoragelocation.ListBSLEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeListBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeListBSLReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (*apiv2.BackupStorageLocation, error) {
	return backupstoragelocation.GetBSLEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeGetBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeGetBSLReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return backupstoragelocation.DeleteBSLEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeDeleteBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeDeleteBSLReq(c, r)
}
