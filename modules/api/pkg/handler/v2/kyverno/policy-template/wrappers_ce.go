//go:build !ee

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

	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.PolicyTemplateProvider) (interface{}, error) {
	return nil, nil
}

func DecodeListPolicyTemplateReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func getEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.PolicyTemplateProvider) (interface{}, error) {
	return nil, nil
}

func DecodeGetPolicyTemplateReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func createEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.PolicyTemplateProvider) (interface{}, error) {
	return nil, nil
}

func DecodeCreatePolicyTemplateReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func patchEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.PolicyTemplateProvider) (interface{}, error) {
	return nil, nil
}

func DecodePatchPolicyTemplateReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}

func deleteEndpoint(_ context.Context, _ interface{}, _ provider.UserInfoGetter, _ provider.PolicyTemplateProvider) error {
	return nil
}

func DecodeDeletePolicyTemplateReq(_ context.Context, _ *http.Request) (interface{}, error) {
	return nil, nil
}
