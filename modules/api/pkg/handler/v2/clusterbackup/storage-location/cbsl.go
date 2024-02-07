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
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

func ListCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}
		return listCBSL(ctx, req, provider, projectProvider)
	}
}

func GetCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}
		return getCBSL(ctx, req, provider, projectProvider)
	}
}

func CreateCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}
		return createCBSL(ctx, req, provider, projectProvider)
	}
}

func DeleteCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}
		return deleteCBSL(ctx, req, provider, projectProvider)
	}
}

func PatchCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}
		return patchCBSL(ctx, req, provider, projectProvider)
	}
}
