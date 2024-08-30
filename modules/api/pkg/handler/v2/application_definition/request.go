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

package applicationdefinition

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
)

// getApplicationDefinitionReq defines HTTP request for getApplicationDefinition
// swagger:parameters getApplicationDefinition
type getApplicationDefinitionReq struct {
	// in: path
	AppDefName string `json:"appdef_name"`
}

// createApplicationDefinitionReq defines HTTP request for createApplicationDefinitionReq
// swagger:parameters createApplicationDefinition
type createApplicationDefinitionReq struct {
	// in: body
	// required: true
	Body apiv2.ApplicationDefinitionBody
}

// updateApplicationDefinitionReq defines HTTP request for updateApplicationDefinitionReq
// swagger:parameters updateApplicationDefinition
type updateApplicationDefinitionReq struct {
	// in: path
	AppDefName string `json:"appdef_name"`

	// in: body
	// required: true
	Body apiv2.ApplicationDefinitionBody
}

// patchApplicationDefinitionReq defines HTTP request for patchApplicationDefinitionReq
// swagger:parameters patchApplicationDefinition
type patchApplicationDefinitionReq struct {
	// in: path
	AppDefName string `json:"appdef_name"`

	// in: body
	// required: true
	Body struct {
		Annotations map[string]string `json:"annotations,omitempty"`
	}
}

func DecodePatchApplicationDefinitionReq(c context.Context, r *http.Request) (interface{}, error) {
	var req patchApplicationDefinitionReq
	appDefName, err := DecodeApplicationDefinitionName(c, r)
	if err != nil {
		return nil, err
	}
	req.AppDefName = appDefName

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

func (r patchApplicationDefinitionReq) Validate() error {
	// Since we are only updating the annotations, we don't need to validate the request.
	return nil
}

// deleteApplicationDefinitionReq defines HTTP request for deleteApplicationDefinitionReq
// swagger:parameters deleteApplicationDefinition
type deleteApplicationDefinitionReq struct {
	// in: path
	AppDefName string `json:"appdef_name"`
}

func DecodeGetApplicationDefinition(c context.Context, r *http.Request) (interface{}, error) {
	var req getApplicationDefinitionReq

	appDefName, err := DecodeApplicationDefinitionName(c, r)
	if err != nil {
		return nil, err
	}
	req.AppDefName = appDefName

	return req, nil
}

func DecodeCreateApplicationDefinition(c context.Context, r *http.Request) (interface{}, error) {
	var req createApplicationDefinitionReq

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

func DecodeUpdateApplicationDefinition(c context.Context, r *http.Request) (interface{}, error) {
	var req updateApplicationDefinitionReq

	appDefName, err := DecodeApplicationDefinitionName(c, r)
	if err != nil {
		return nil, err
	}
	req.AppDefName = appDefName

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

func DecodeDeleteApplicationDefinition(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteApplicationDefinitionReq

	appDefName, err := DecodeApplicationDefinitionName(c, r)
	if err != nil {
		return nil, err
	}
	req.AppDefName = appDefName

	return req, nil
}

func DecodeApplicationDefinitionName(c context.Context, r *http.Request) (string, error) {
	appDefName := mux.Vars(r)["appdef_name"]
	if appDefName == "" {
		return "", fmt.Errorf("'appDefName' parameter is required but was not provided")
	}

	return appDefName, nil
}
