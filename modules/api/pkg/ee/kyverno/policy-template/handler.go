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

package policytemplate

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

// getPolicyTemplateReq defines HTTP request for getting a policy template
// swagger:parameters getPolicyTemplate
type getPolicyTemplateReq struct {
	// in: path
	// required: true
	PolicyTemplateName string `json:"template_name"`
}

// createPolicyTemplateReq defines HTTP request for creating a policy template
// swagger:parameters createPolicyTemplate
type createPolicyTemplateReq struct {
	// in: body
	// required: true
	apiv2.PolicyTemplate
}

// patchPolicyTemplateReq defines HTTP request for patching a policy template
// swagger:parameters patchpolicyTemplate
type patchPolicyTemplateReq struct {
	// in: path
	// required: true
	PolicyTemplateName string `json:"template_name"`
	// in: body
	// required: true
	apiv2.PolicyTemplate
}

// deletePolicyTemplateReq defines HTTP request for deleting a policy template
// swagger:parameters deletePolicyTemplate
type deletePolicyTemplateReq struct {
	// in: path
	// required: true
	PolicyTemplateName string `json:"template_name"`
}

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	userInfo, err := userInfoGetter(ctx, "")

	if err != nil {
		return nil, err
	}

	if !userInfo.IsAdmin {
		return nil, utilerrors.NewNotAuthorized()
	}
	policyTemplateList, err := provider.List(ctx)

	return policyTemplateList, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	req, ok := request.(getPolicyTemplateReq)
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
	policytemplate, err := provider.Get(ctx, req.PolicyTemplateName)

	if err != nil {
		return nil, err
	}

	res := apiv2.PolicyTemplate{
		Name: policytemplate.Name,
		Spec: *policytemplate.Spec.DeepCopy(),
	}

	return res, nil
}

func DecodeGetPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getPolicyTemplateReq

	req.PolicyTemplateName = mux.Vars(r)["template_name"]
	if req.PolicyTemplateName == "" {
		return "", fmt.Errorf("'template_name' parameter is required but was not provided")
	}

	return req, nil
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	req, ok := request.(createPolicyTemplateReq)
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

	policyTemplateSpec := req.Spec.DeepCopy()

	if policyTemplateSpec == nil {
		return nil, fmt.Errorf("policyTemplateSpec is nil")
	}

	policyTemplate := &kubermaticv1.PolicyTemplate{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
		},
		Spec: *policyTemplateSpec,
	}

	created, err := provider.Create(ctx, policyTemplate)
	if err != nil {
		return nil, err
	}

	return &apiv2.PolicyTemplate{
		Name: created.Name,
		Spec: *created.Spec.DeepCopy(),
	}, nil
}

func DecodeCreatePolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req createPolicyTemplateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {

	req, ok := request.(patchPolicyTemplateReq)
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

	policyTemplate := &kubermaticv1.PolicyTemplate{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
		},
		Spec: req.Spec,
	}
	patchedPolicyTemplate, err := provider.Patch(ctx, policyTemplate)

	return patchedPolicyTemplate, nil
}

func DecodePatchPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req patchPolicyTemplateReq

	req.PolicyTemplateName = mux.Vars(r)["template_name"]
	if req.PolicyTemplateName == "" {
		return "", fmt.Errorf("'template_name' parameter is required but was not provided")
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) error {
	req, ok := request.(deletePolicyTemplateReq)
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

	err = provider.Delete(ctx, req.PolicyTemplateName)

	if err != nil {
		return err
	}

	return nil
}

func DecodeDeletePolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req deletePolicyTemplateReq

	req.PolicyTemplateName = mux.Vars(r)["template_name"]
	if req.PolicyTemplateName == "" {
		return "", fmt.Errorf("'template_name' parameter is required but was not provided")
	}

	return req, nil
}
