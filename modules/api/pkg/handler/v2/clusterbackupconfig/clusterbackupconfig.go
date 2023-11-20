package clusterbackupconfig

import (
	"context"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"k8c.io/dashboard/v2/pkg/provider"
)

func CreateEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return createEndpoint(ctx, request)
	}
}

func DecodeCreateClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeCreateClusterBackupConfigReq(c, r)
}

func ListEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return listEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeListClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListClusterBackupConfigReq(c, r)
}

func GetEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return getEndpoint(ctx, request)
	}
}

func DecodeGetClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeGetClusterBackupConfigReq(c, r)
}

func DeleteEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return deleteEndpoint(ctx, request)
	}
}

func DecodeDeleteClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeDeleteClusterBackupConfigReq(c, r)
}

func ProjectListEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return projectListEndpoint(ctx, request)
	}
}

func DecodeListProjectClustersBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListProjectClustersBackupConfigReq(c, r)
}
