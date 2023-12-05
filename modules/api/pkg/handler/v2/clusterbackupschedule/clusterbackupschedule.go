package clusterbackupschedule

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

func DecodeCreateClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeCreateClusterBackupScheduleReq(c, r)
}

func ListEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return listEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeListClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListClusterBackupScheduleReq(c, r)
}

func GetEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return getEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeGetRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeGetRestoreBackupConfigReq(c, r)

}

func DeleteEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return deleteEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

// check the name
func DecodeDeleteClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeDeleteClusterBackupScheduleReq(c, r)
}
