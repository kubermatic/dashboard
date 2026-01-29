/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package userclusterconfig

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
)

// UpdateAPConfigReq defines HTTP request for UpdateAPConfigReq
// swagger:parameters updateAdmissionPluginsConfiguration
type UpdateAPConfigReq struct {
	// in: body
	// required: true
	Plugins apiv2.AdmissionPluginsConfiguration
}

func GetAdmissionPluginsConfiguration(userClusterConfig provider.UserClusterConfigProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		config, err := userClusterConfig.GetAdmissionPluginsConfiguration(ctx)
		if err != nil {
			return nil, err
		}
		return config, nil
	}
}

func UpdateAdmissionPluginsConfiguration(userInfoGetter provider.UserInfoGetter, userClusterConfig provider.UserClusterConfigProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(UpdateAPConfigReq)
		if !ok {
			return nil, fmt.Errorf("invalid request type")
		}
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}

		updatedConfig, err := userClusterConfig.UpdateAdmissionPluginsConfiguration(ctx, userInfo, req.Plugins)

		if err != nil {
			return nil, err
		}
		return updatedConfig, nil
	}
}

func DecodeUpdateAdmissionPlugins(c context.Context, r *http.Request) (interface{}, error) {
	var req UpdateAPConfigReq

	if err := json.NewDecoder(r.Body).Decode(&req.Plugins); err != nil {
		return nil, err
	}

	return req, nil
}
