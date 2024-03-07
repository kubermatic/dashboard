//go:build !ee

/*
Copyright 2024 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package storagelocation

import (
	"context"
	"net/http"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listCBSL(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.BackupStorageProvider,
	_ provider.ProjectProvider,
) ([]*apiv2.ClusterBackupStorageLocation, error) {
	return nil, nil
}

func getCBSL(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.BackupStorageProvider,
	_ provider.ProjectProvider,
) (*apiv2.ClusterBackupStorageLocation, error) {
	return nil, nil
}

func createCBSL(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.BackupStorageProvider,
	_ provider.ProjectProvider,
) (*apiv2.ClusterBackupStorageLocation, error) {
	return nil, nil
}

func deleteCBSL(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.BackupStorageProvider,
	_ provider.ProjectProvider,
) error {
	return nil
}

func patchCBSL(
	_ context.Context,
	_ interface{},
	_ provider.UserInfoGetter,
	_ provider.BackupStorageProvider,
	_ provider.ProjectProvider,
) (*apiv2.ClusterBackupStorageLocation, error) {
	return nil, nil
}

func DecodeListProjectCBSLReq(
	_ context.Context,
	_ *http.Request,
) (interface{}, error) {
	return nil, nil
}

func DecodeGetCBSLReq(
	_ context.Context,
	_ *http.Request,
) (interface{}, error) {
	return nil, nil
}

func DecodeCreateCBSLReq(
	_ context.Context,
	_ *http.Request,
) (interface{}, error) {
	return nil, nil
}

func DecodeDeleteCBSLReq(
	_ context.Context,
	_ *http.Request,
) (interface{}, error) {
	return nil, nil
}

func DecodePatchCBSLReq(
	_ context.Context,
	_ *http.Request,
) (interface{}, error) {
	return nil, nil
}
