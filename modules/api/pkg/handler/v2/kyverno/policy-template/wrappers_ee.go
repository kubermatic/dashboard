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

package policytemplate

import (
	"context"
	"net/http"

	policytemplate "k8c.io/dashboard/v2/pkg/ee/kyverno/policy-template"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.PrivilegedProjectProvider, provider provider.PolicyTemplateProvider) (interface{}, error) {
	return policytemplate.ListEndpoint(ctx, request, userInfoGetter, projectProvider, provider)
}

func DecodeListPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policytemplate.DecodeListPolicyTemplateReq(ctx, r)
}

func getEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	return policytemplate.GetEndpoint(ctx, request, userInfoGetter, provider)
}

func DecodeGetPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policytemplate.DecodeGetPolicyTemplateReq(ctx, r)
}

func createEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	return policytemplate.CreateEndpoint(ctx, request, userInfoGetter, provider)
}

func DecodeCreatePolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policytemplate.DecodeCreatePolicyTemplateReq(ctx, r)
}

func patchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	return policytemplate.PatchEndpoint(ctx, request, userInfoGetter, provider)
}

func DecodePatchPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policytemplate.DecodePatchPolicyTemplateReq(ctx, r)
}

func deleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) error {
	return policytemplate.DeleteEndpoint(ctx, request, userInfoGetter, provider)
}

func DecodeDeletePolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return policytemplate.DecodeDeletePolicyTemplateReq(ctx, r)
}
