//go:build ee

package clusterbackupconfig

import (
	"context"
	"net/http"

	clusterbackupconfig "k8c.io/dashboard/v2/pkg/ee/clusterbackupsconfig"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupconfig.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupconfig.DecodeListClusterBackupConfigReq(c, r)
}

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupconfig.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupconfig.DecodeCreateClusterBackupConfigReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupconfig.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupconfig.DecodeGetClusterBackupConfigReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackupconfig.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupconfig.DecodeDeleteClusterBackupConfigReq(c, r)
}

func projectListEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterbackupconfig.ProjectListEndpoint(ctx, request)
}

func decodeListProjectClustersBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackupconfig.DecodeListProjectClustersBackupConfigReq(c, r)
}
