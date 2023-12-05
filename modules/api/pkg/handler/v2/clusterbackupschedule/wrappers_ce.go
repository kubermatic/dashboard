//go:build !ee

package clusterbackupschedule

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
	_ provider.PrivilegedProjectProvider,
) (interface{}, error) {
	return nil, nil
}

func decodeCreateClusterBackupScheduleReq(_ context.Context, _ *http.Request) (interface{}, error) {
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

func decodeListClusterBackupScheduleReq(_ context.Context, _ *http.Request) (interface{}, error) {
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

func decodeGetRestoreBackupConfigReq(_ context.Context, _ *http.Request) (interface{}, error) {
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

func decodeDeleteClusterBackupScheduleReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}
