//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2025 Kubermatic GmbH

   1.	You may only view, read and display for studying purposes the source
      code of the software licensed under this license, and, to the extent
      explicitly provided under this license, the binary code.
   2.	Any use of the software which exceeds the foregoing right, including,
      without limitation, its execution, compilation, copying, modification
      and distribution, is expressly prohibited.
   3.	THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   END OF TERMS AND CONDITIONS
*/

package policyinstance

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

type getPolicyInstanceReq struct {
	// in: path
	// required: true
	PolicyInstanceName string `json:"instance_name"`
}

type createPolicyInstanceReq struct {
	// in: body
	// required: true
	body apiv2.PolicyInstance
}

type patchPolicyInstanceReq struct {
	// in: path
	// required: true
	PolicyInstanceName string `json:"instance_name"`
	// in: body
	// required: true
	body apiv2.PolicyInstance
}

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}

	// TODO: add the logic for getting list of policies instances from kkp check if it depend on clusterID or projectID

	res := []*apiv2.PolicyInstance{}

	return res, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	req, ok := request.(getPolicyInstanceReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}
	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}

	// TODO: add the logic for getting a Policy Instance from kkp

	res := apiv2.PolicyInstance{
		Name: req.PolicyInstanceName,
	}

	return res, nil
}

func DecodeGetPolicyInstanceReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getPolicyInstanceReq

	req.PolicyInstanceName = mux.Vars(r)["instance_name"]
	if req.PolicyInstanceName == "" {
		return "", fmt.Errorf("'instance_name' parameter is required but was not provided")
	}

	return req, nil
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	req, ok := request.(createPolicyInstanceReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}

	// change this type to kubermaticv1.policyInstance
	policyInstance := &apiv2.PolicyInstance{
		Name: req.body.Name,
		// check the DeepCopy() method from kubermaticv1
		Spec: req.body.Spec,
	}

	// TODO: add the logic for adding a policy inatance to kkp

	return policyInstance, nil
}

func DecodeCreatePolicyInstanceReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req createPolicyInstanceReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	req, ok := request.(patchPolicyInstanceReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}

	// change this type to kubermaticv1.PolicyInstance
	policyInstance := apiv2.PolicyInstance{
		Name: req.PolicyInstanceName,
		// check the DeepCopy() method from kubermaticv1
		Spec: req.body.Spec,
	}

	// TODO: add the logic for patching a policy inatance to kkp
	return policyInstance, nil
}

func DecodePatchPolicyInstanceReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req patchPolicyInstanceReq

	req.PolicyInstanceName = mux.Vars(r)["instance_name"]
	if req.PolicyInstanceName == "" {
		return "", fmt.Errorf("'instance_name' parameter is required but was not provided")
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	req, ok := request.(getPolicyInstanceReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}
	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}

	// TODO: add the logic for deleting template from kkp
	// check the return value
	return req, nil
}
