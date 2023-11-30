//go:build !ee

package clusterrestore

import (
	"context"
	"net/http"

	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.ProjectProvider,
	_ provider.PrivilegedProjectProvider) (interface{}, error) {
	return nil, nil
}

func decodeCreateClusterRestoreReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func listEndpoint(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.ProjectProvider,
	_ provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return nil, nil
}

func decodeListClusterRestoreReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func getEndpoint(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.ProjectProvider,
	_ provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return nil, nil
}

func decodeGetRestoreBackupReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func deleteEndpoint(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.ProjectProvider,
	_ provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return nil, nil
}

func decodeDeleteClusterRestoreReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}
