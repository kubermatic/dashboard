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

package policyinstance

import (
	"context"
	"net/http"

	policyinstance "k8c.io/dashboard/v2/pkg/ee/kyverno/policy-instance"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policyinstance.ListEndpoint(ctx, request, userInfoGetter)
}

func getEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policyinstance.GetEndpoint(ctx, request, userInfoGetter)
}

func DecodeGetPolicyInstanceReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policyinstance.DecodeGetPolicyInstanceReq(ctx, r)
}

func createEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policyinstance.CreateEndpoint(ctx, request, userInfoGetter)
}

func DecodeCreatePolicyInstanceReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policyinstance.DecodeCreatePolicyInstanceReq(ctx, r)
}

func patchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policyinstance.PatchEndpoint(ctx, request, userInfoGetter)
}

func DecodePatchPolicyInstanceReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policyinstance.DecodePatchPolicyInstanceReq(ctx, r)
}

func deleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	return policyinstance.DeleteEndpoint(ctx, request, userInfoGetter)
}
