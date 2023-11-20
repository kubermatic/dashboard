//go:build !ee

package clusterrestoreconfig

import (
	"context"
	"net/http"

	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(_ context.Context, _ interface{}) (interface{}, error) {
	return nil, nil
}

func decodeCreateClusterRestoreConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
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

func decodeListClusterRestoreConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func getEndpoint(_ context.Context, _ interface{}) (interface{}, error) {
	return nil, nil
}

func decodeGetRestoreBackupConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func deleteEndpoint(_ context.Context, _ interface{}) (interface{}, error) {
	return nil, nil
}

func decodeDeleteClusterRestoreConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func projectListEndpoint(_ context.Context, _ interface{}) (interface{}, error) {
	return nil, nil
}

func decodeListProjectClustersRestoreBackupConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}
