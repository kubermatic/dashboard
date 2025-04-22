/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

package kubernetesdashboard

import (
	"net/http"

	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	commonv2 "k8c.io/dashboard/v2/pkg/handler/common"
)

type InitialRequest struct {
	// Embed the original request
	*http.Request

	// in: query
	ProjectID string `json:"projectID"`
	ClusterID string `json:"clusterID"`
}

func (r *InitialRequest) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: r.ClusterID,
	}
}

func (r *InitialRequest) decode(req *http.Request) *InitialRequest {
	r.ProjectID = req.URL.Query().Get("projectID")
	r.ClusterID = req.URL.Query().Get("clusterID")

	r.Request = req

	return r
}

func NewInitialRequest(r *http.Request) *InitialRequest {
	result := new(InitialRequest)
	return result.decode(r)
}

type OIDCCallbackRequest struct {
	// Embed the original request
	*http.Request

	// in: query
	Code  string              `json:"code"`
	State *commonv2.OIDCState `json:"state"`
}

func (r *OIDCCallbackRequest) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: r.State.ClusterID,
	}
}

func (r *OIDCCallbackRequest) decode(req *http.Request) (*OIDCCallbackRequest, error) {
	r.Code = req.URL.Query().Get("code")
	state := req.URL.Query().Get("state")
	r.Request = req

	var err error
	r.State, err = decodeOIDCState(state)
	if err != nil {
		return nil, err
	}

	return r, nil
}

func NewOIDCCallbackRequest(r *http.Request) (*OIDCCallbackRequest, error) {
	result := new(OIDCCallbackRequest)
	return result.decode(r)
}

type ProxyRequest struct {
	// Embed the original request
	*http.Request

	// in: path
	ProjectID string `json:"project_id"`
	ClusterID string `json:"cluster_id"`

	// in: query
	Token string `json:"token"`
}

func (r *ProxyRequest) decode(req *http.Request) *ProxyRequest {
	// Path params
	r.ProjectID = mux.Vars(req)["project_id"]
	r.ClusterID = mux.Vars(req)["cluster_id"]

	// Query params
	r.Token = req.URL.Query().Get("token")

	// Embed original request
	r.Request = req

	return r
}

// GetSeedCluster implements the middleware.seedClusterGetter interface.
func (r *ProxyRequest) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: r.ClusterID,
	}
}

func NewProxyRequest(r *http.Request) *ProxyRequest {
	result := new(ProxyRequest)
	return result.decode(r)
}
