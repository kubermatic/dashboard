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

package policybinding

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// getPolicyBindingReq defines HTTP request for getting a policy binding
// swagger:parameters getPolicyBinding
type getPolicyBindingReq struct {
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
}

// createPolicyBindingReq defines HTTP request for creating a policy binding
// swagger:parameters createPolicyBinding
type createPolicyBindingReq struct {
	// in: body
	// required: true
	apiv2.PolicyBinding
}

// patchPolicyBindingReq defines HTTP request for patching a policy binding
// swagger:parameters patchPolicyBinding
type patchPolicyBindingReq struct {
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
	// in: body
	// required: true
	apiv2.PolicyBinding
}

// deletePolicyBindingReq defines HTTP request for deleting a policy binding
// swagger:parameters deletePolicyBinding
type deletePolicyBindingReq struct {
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
}

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("userInfo:", userInfo)
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	policyBindingList, err := provider.List(ctx)

	res := []*apiv2.PolicyBinding{}
	for _, policyBinding := range policyBindingList.Items {
		res = append(res, &apiv2.PolicyBinding{
			Name: policyBinding.Name,
			Spec: policyBinding.Spec,
		})
	}

	return policyBindingList, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(getPolicyBindingReq)
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
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("policyBindingName:", req.PolicyBindingName)
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	policyBinding, err := provider.Get(ctx, req.PolicyBindingName)
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("policyBinding:", policyBinding)
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	return &apiv2.PolicyBinding{
		Name: policyBinding.Name,
		Spec: policyBinding.Spec,
	}, nil
}

func DecodeGetPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getPolicyBindingReq

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	return req, nil
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(createPolicyBindingReq)
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

	policyBindingSpec := req.Spec.DeepCopy()
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("policyBindingSpec:", policyBindingSpec)
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	policyBinding := &kubermaticv1.PolicyBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
		},
		Spec: *policyBindingSpec,
	}

	created, err := provider.Create(ctx, policyBinding)
	if err != nil {
		return nil, err
	}
	return &apiv2.PolicyBinding{
		Name: created.Name,
		Spec: created.Spec,
	}, nil
}

func DecodeCreatePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req createPolicyBindingReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(patchPolicyBindingReq)
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

	policyBinding := &kubermaticv1.PolicyBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.PolicyBindingName,
		},
		Spec: req.Spec,
	}

	patchedPolicyBinding, err := provider.Patch(ctx, policyBinding)

	return &apiv2.PolicyBinding{
		Name: patchedPolicyBinding.Name,
		Spec: *patchedPolicyBinding.Spec.DeepCopy(),
	}, nil
}

func DecodePatchPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req patchPolicyBindingReq

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) error {
	req, ok := request.(deletePolicyBindingReq)
	if !ok {
		return utilerrors.NewBadRequest("invalid request")
	}
	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return err
	}

	if !userInfo.IsAdmin {
		return utilerrors.NewNotAuthorized()
	}

	err = provider.Delete(ctx, req.PolicyBindingName)
	if err != nil {
		return err
	}

	return nil
}

func DecodeDeletePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req deletePolicyBindingReq

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	return req, nil
}
