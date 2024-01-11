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

package clusterbackupschedule

import (
	"context"
	"net/http"

	clusterbackupschedule "k8c.io/dashboard/v2/pkg/ee/clusterbackup/schedule"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(
	ctx context.Context, req interface{},
	userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return clusterbackupschedule.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeCreateClusterBackupScheduleReq(c, r)
}

func listEndpoint(
	ctx context.Context, req interface{},
	userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return clusterbackupschedule.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeListClusterBackupScheduleReq(c, r)
}

func getEndpoint(
	ctx context.Context, req interface{},
	userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return clusterbackupschedule.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeGetClusterBackupScheduleReq(c, r)
}

func deleteEndpoint(
	ctx context.Context, req interface{},
	userInfoGetter provider.UserInfoGetter,
	projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return clusterbackupschedule.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeDeleteClusterBackupScheduleReq(c, r)
}
