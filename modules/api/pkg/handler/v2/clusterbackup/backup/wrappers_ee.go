//go:build ee

package clusterbackup

import (
	"context"
	"net/http"

	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeListClusterBackupReq(c, r)
}

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeCreateClusterBackupReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeGetClusterBackupReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeDeleteClusterBackupReq(c, r)
}

func projectListEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterbackup.ProjectListEndpoint(ctx, request)
}

func decodeListProjectClustersBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeListProjectClustersBackupConfigReq(c, r)
}
