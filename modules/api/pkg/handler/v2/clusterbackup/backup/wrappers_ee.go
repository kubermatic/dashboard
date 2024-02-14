//go:build ee

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

package clusterbackup

import (
	"context"
	"net/http"

	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return clusterbackup.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeListClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeListClusterBackupReq(c, r)
}

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return clusterbackup.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeCreateClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeCreateClusterBackupReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return clusterbackup.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeGetClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeGetClusterBackupReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return clusterbackup.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeDeleteClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeDeleteClusterBackupReq(c, r)
}

func downloadURLEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	return clusterbackup.DownloadURLEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider, settingsProvider)
}

func decodeDownloadURLReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeDownloadURLReq(c, r)
}
