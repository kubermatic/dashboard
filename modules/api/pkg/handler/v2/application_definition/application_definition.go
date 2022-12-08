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
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

func ListApplicationDefinitions(applicationDefinitionProvider provider.ApplicationDefinitionProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		defList, err := applicationDefinitionProvider.ListUnsecured(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		definitions := make([]*apiv2.ApplicationDefinitionListItem, len(defList.Items))
		for i := range defList.Items {
			definitions[i] = convertInternalToAPIApplicationDefinitionForList(&defList.Items[i])
		}

		return definitions, nil
	}
}

func GetApplicationDefinition(applicationDefinitionProvider provider.ApplicationDefinitionProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		req, ok := request.(getApplicationDefinitionReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		appdef, err := applicationDefinitionProvider.GetUnsecured(ctx, req.AppDefName)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		return convertInternalToAPIApplicationDefinition(appdef), nil
	}
}

func CreateApplicationDefinition(userInfoGetter provider.UserInfoGetter, applicationDefinitionProvider provider.ApplicationDefinitionProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}

		req, ok := request.(createApplicationDefinitionReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		appdef, err := applicationDefinitionProvider.CreateUnsecured(ctx, convertAPItoInternalApplicationDefinitionBody(&req.Body))
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		return appdef, nil
	}
}

func UpdateApplicationDefinition(userInfoGetter provider.UserInfoGetter, applicationDefinitionProvider provider.ApplicationDefinitionProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, fmt.Sprintf("forbidden: \"%s\" doesn't have admin rights", userInfo.Email))
		}

		req, ok := request.(updateApplicationDefinitionReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		curAppDef, err := applicationDefinitionProvider.GetUnsecured(ctx, req.AppDefName)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		reqAppDef := convertAPItoInternalApplicationDefinitionBody(&req.Body)
		curAppDef.Spec = reqAppDef.Spec

		resAppDef, err := applicationDefinitionProvider.UpdateUnsecured(ctx, curAppDef)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		return convertInternalToAPIApplicationDefinition(resAppDef), nil
	}
}
