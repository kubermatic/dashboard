//go:build ee

package clusterrestore

import (
	"context"
	"net/http"

	clusterrestore "k8c.io/dashboard/v2/pkg/ee/clusterbackup/restore"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeCreateClusterRestoreReq(c, r)
}

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeListClusterRestoreReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetRestoreBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeGetRestoreBackupReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeDeleteClusterRestoreReq(c, r)
}
