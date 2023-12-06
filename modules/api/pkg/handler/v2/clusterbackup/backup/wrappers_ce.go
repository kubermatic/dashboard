//go:build !ee

package clusterbackup

import (
	"context"
	"net/http"

	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.ProjectProvider,
	_ provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return nil, nil
}

func decodeListClusterBackupReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func createEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.ProjectProvider, _ provider.PrivilegedProjectProvider) (interface{}, error) {
	return nil, nil
}

func decodeCreateClusterBackupReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func getEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.ProjectProvider, _ provider.PrivilegedProjectProvider) (interface{}, error) {
	return nil, nil
}

func decodeGetClusterBackupReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func deleteEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.ProjectProvider, _ provider.PrivilegedProjectProvider) (interface{}, error) {
	return nil, nil
}

func decodeDeleteClusterBackupReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func projectListEndpoint(_ context.Context, _ interface{}) (interface{}, error) {
	return nil, nil
}

func decodeListProjectClustersBackupConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}
