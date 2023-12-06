package clusterbackup

import (
	"context"
	"net/http"

	"github.com/go-kit/kit/endpoint"

	"k8c.io/dashboard/v2/pkg/provider"
)

func CreateEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return createEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeCreateClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeCreateClusterBackupReq(c, r)
}

func ListEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return listEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeListClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListClusterBackupReq(c, r)
}

func GetEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return getEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeGetClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeGetClusterBackupReq(c, r)
}

func DeleteEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return deleteEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeDeleteClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeDeleteClusterBackupReq(c, r)
}

func ProjectListEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return projectListEndpoint(ctx, request)
	}
}

func DecodeListProjectClustersBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListProjectClustersBackupConfigReq(c, r)
}
