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

package provider

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"

	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

// TinkerbellListImagesReq represents a request to list Tinkerbell images
// swagger:parameters listTinkerbellImages
type TinkerbellListImagesReq struct {
	// in: path
	// required: true
	DC string `json:"dc"`
}

func TinkerbellImagesEndpoint(userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(TinkerbellListImagesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		return providercommon.TinkerbellImages(ctx, req.DC, userInfoGetter, seedsGetter)
	}
}

func DecodeTinkerbellListImageReq(c context.Context, r *http.Request) (interface{}, error) {
	var req TinkerbellListImagesReq

	dc, ok := mux.Vars(r)["dc"]
	if !ok {
		return req, fmt.Errorf("'dc' parameter is required")
	}
	req.DC = dc

	return req, nil
}
