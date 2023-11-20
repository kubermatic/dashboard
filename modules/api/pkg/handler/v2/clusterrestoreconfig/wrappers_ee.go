//go:build ee

package clusterrestoreconfig

import (
	"context"
	"net/http"

	clusterrestoreconfig "k8c.io/dashboard/v2/pkg/ee/clusterrestoreconfig"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterrestoreconfig.CreateEndpoint(ctx, request)
}

func decodeCreateClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestoreconfig.DecodeCreateClusterRestoreConfigReq(c, r)
}

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestoreconfig.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestoreconfig.DecodeListClusterRestoreConfigReq(c, r)
}

func getEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterrestoreconfig.GetEndpoint(ctx, request)
}

func decodeGetRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestoreconfig.DecodeGetRestoreBackupConfigReq(c, r)
}

func deleteEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterrestoreconfig.DeleteEndpoint(ctx, request)
}

func decodeDeleteClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestoreconfig.DecodeDeleteClusterRestoreConfigReq(c, r)
}

func projectListEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterrestoreconfig.ProjectListEndpoint(ctx, request)
}

func decodeListProjectClustersRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestoreconfig.DecodeListProjectClustersRestoreBackupConfigReq(c, r)
}
