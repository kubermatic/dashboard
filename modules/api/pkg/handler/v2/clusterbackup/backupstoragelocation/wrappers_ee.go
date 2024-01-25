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

package backupstoragelocation

import (
	"context"
	"net/http"

	backupstoragelocation "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backupstoragelocation"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return backupstoragelocation.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeCreateBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeCreateBackupStorageLocationReq(c, r)
}

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return backupstoragelocation.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeListBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeListBackupStorageLocationReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return backupstoragelocation.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeGetBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeGetBackupStorageLocationReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return backupstoragelocation.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeDeleteBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodeDeleteBackupStorageLocationReq(c, r)
}

func patchEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return backupstoragelocation.PatchEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodePatchBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	return backupstoragelocation.DecodePatchBackupStorageLocationReq(c, r)
}
