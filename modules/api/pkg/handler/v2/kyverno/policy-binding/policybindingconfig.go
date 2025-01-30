/*
Copyright 2025 The Kubermatic Kubernetes Platform contributors.

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

package policybinding

import (
	"context"

	"github.com/go-kit/kit/endpoint"
	"k8c.io/dashboard/v2/pkg/provider"
)

func ListEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return listEndpoint(ctx, request, userInfoGetter, provider)
	}
}

func GetEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return getEndpoint(ctx, request, userInfoGetter, provider)
	}
}

func CreateEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return createEndpoint(ctx, request, userInfoGetter, provider)
	}
}

func PatchEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return patchEndpoint(ctx, request, userInfoGetter, provider)
	}
}

func DeleteEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		return nil, deleteEndpoint(ctx, request, userInfoGetter, provider)
	}
}
