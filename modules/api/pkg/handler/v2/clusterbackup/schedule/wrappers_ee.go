//go:build ee

package clusterbackupschedule

import (
	"context"
	"net/http"

	clusterbackupschedule "k8c.io/dashboard/v2/pkg/ee/clusterbackup/schedule"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupschedule.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeCreateClusterBackupScheduleReq(c, r)
}

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupschedule.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeListClusterBackupScheduleReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupschedule.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeGetClusterBackupScheduleReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupschedule.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupschedule.DecodeDeleteClusterBackupScheduleReq(c, r)
}
