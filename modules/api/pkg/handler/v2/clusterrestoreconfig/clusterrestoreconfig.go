package clusterrestoreconfig

import (
	"context"
	"net/http"

	"github.com/go-kit/kit/endpoint"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
)

type rbcBody struct {
	// Name of the cluster backup config
	Name string `json:"name,omitempty"`
	ID   string `json:"id,omitempty"`
	// ClusterRestoreConfigSpec Spec of the cluster backup config
	Spec apiv2.ClusterRestoreConfigSpec `json:"spec,omitempty"`
}

var projectRestoreObjectsArr []rbcBody

func CreateEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return createEndpoint(ctx, request)
	}
}

func DecodeCreateClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeCreateClusterRestoreConfigReq(c, r)
}

func ListEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return listEndpoint(ctx, request, userInfoGetter, projectProvider, privilegedProjectProvider)
	}
}

func DecodeListClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListClusterRestoreConfigReq(c, r)
}

func GetEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return getEndpoint(ctx, request)
	}
}

func DecodeGetRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeGetRestoreBackupConfigReq(c, r)

}

func DeleteEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return deleteEndpoint(ctx, request)
	}
}

// check the name
func DecodeDeleteClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeDeleteClusterRestoreConfigReq(c, r)
}

func ProjectListEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return projectListEndpoint(ctx, request)
	}
}

type listProjectClustersRestoreConfigReq struct {
	common.ProjectReq
}

func DecodeListProjectClustersRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return decodeListProjectClustersRestoreBackupConfigReq(c, r)
}
