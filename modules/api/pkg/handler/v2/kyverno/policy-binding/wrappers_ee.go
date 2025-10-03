//go:build ee

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
	"net/http"

	policybinding "k8c.io/dashboard/v2/pkg/ee/kyverno/policy-binding"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policybinding.ListEndpoint(ctx, request, userInfoGetter)
}

func DecodeListPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policybinding.DecodeListPolicyBindingReq(ctx, r)
}

func getEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policybinding.GetEndpoint(ctx, request, userInfoGetter)
}

func DecodeGetPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policybinding.DecodeGetPolicyBindingReq(ctx, r)
}

func createEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policybinding.CreateEndpoint(ctx, request, userInfoGetter)
}

func DecodeCreatePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policybinding.DecodeCreatePolicyBindingReq(ctx, r)
}

func patchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policybinding.PatchEndpoint(ctx, request, userInfoGetter)
}

func DecodePatchPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policybinding.DecodePatchPolicyBindingReq(ctx, r)
}

func deleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) error {
	return policybinding.DeleteEndpoint(ctx, request, userInfoGetter)
}

func DecodeDeletePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policybinding.DecodeDeletePolicyBindingReq(ctx, r)
}
