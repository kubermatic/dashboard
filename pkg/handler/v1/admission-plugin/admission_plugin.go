/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

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

package admissionplugin

import (
	"context"
	"fmt"
	"net/http"

	semverlib "github.com/Masterminds/semver/v3"
	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"

	"k8s.io/apimachinery/pkg/util/sets"
)

func GetAdmissionPluginEndpoint(admissionPluginProvider provider.AdmissionPluginsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(admissionPluginReq)
		pluginResponse, err := admissionPluginProvider.ListPluginNamesFromVersion(ctx, req.Version)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		// for the backward compatibility we have to keep those plugins as a default
		plugins := sets.NewString(
			"PodNodeSelector",
			"EventRateLimit",
		)

		v, err := semverlib.NewVersion(req.Version)
		if err != nil {
			return nil, err
		}

		// Pod Security Policy was removed in k8s v1.25
		gteKube125Condition, _ := semverlib.NewConstraint(">= 1.25")
		if !gteKube125Condition.Check(v) {
			plugins.Insert("PodSecurityPolicy")
		}
		plugins.Insert(pluginResponse...)

		return plugins.List(), nil
	}
}

// admissionPluginReq defines HTTP request for getAdmissionPlugins
// swagger:parameters getAdmissionPlugins
type admissionPluginReq struct {
	// in: path
	Version string `json:"version"`
}

func DecodeGetAdmissionPlugin(c context.Context, r *http.Request) (interface{}, error) {
	version := mux.Vars(r)["version"]
	if version == "" {
		return nil, fmt.Errorf("'version' parameter is required but was not provided")
	}

	return admissionPluginReq{Version: version}, nil
}
