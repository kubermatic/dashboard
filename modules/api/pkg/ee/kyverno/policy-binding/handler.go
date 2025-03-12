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
	"slices"

	"github.com/gorilla/mux"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// listPolicyBindingReq defines HTTP request for getting a list of policy bindings
// swagger:parameters listPolicyBinding
type listPolicyBindingReq struct {
	// in: query
	ProjectID string `json:"project_id,omitempty"`
}

// getPolicyBindingReq defines HTTP request for getting a policy binding
// swagger:parameters getPolicyBinding
type getPolicyBindingReq struct {
	// in: path
	// required: true
	Namespace string `json:"namespace"`
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
	// in: query
	ProjectID string `json:"project_id,omitempty"`
}

// createPolicyBindingReq defines HTTP request for creating a policy binding
// swagger:parameters createPolicyBinding
type createPolicyBindingReq struct {
	// in: body
	// required: true
	Body createPolicyBindingBody
}

// patchPolicyBindingReq defines HTTP request for patching a policy binding
// swagger:parameters patchPolicyBinding
type patchPolicyBindingReq struct {
	// PolicyBindingName is the name of the policy binding
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
	// in: body
	// required: true
	Body patchPolicyBindingBody `json:"body"`
}

// deletePolicyBindingReq defines HTTP request for deleting a policy binding
// swagger:parameters deletePolicyBinding
type deletePolicyBindingReq struct {
	// in: path
	// required: true
	Namespace string `json:"namespace"`
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
	// in: query
	ProjectID string `json:"project_id,omitempty"`
}

type createPolicyBindingBody struct {
	Name      string                         `json:"name"`
	Namespace string                         `json:"namespace"`
	ProjectID string                         `json:"projectID"`
	Spec      kubermaticv1.PolicyBindingSpec `json:"spec"`
}

type patchPolicyBindingBody struct {
	Namespace string `json:"namespace"`
	Spec      kubermaticv1.PolicyBindingSpec
	ProjectID string `json:"projectID"`
}

const globalScope = "global"

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(listPolicyBindingReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	if req.ProjectID == "" && !user.IsAdmin {
		return nil, fmt.Errorf("project_id parameter is required for non-admin users.")
	}

	policyBindingList, err := provider.ListUnsecured(ctx)
	if err != nil {
		return nil, err
	}
	res := []*apiv2.PolicyBinding{}
	for _, policyBinding := range policyBindingList.Items {
		if policyBinding.Spec.Target.Projects.SelectAll || slices.Contains(policyBinding.Spec.Target.Projects.Name, req.ProjectID) || req.ProjectID == "" {
			res = append(res, &apiv2.PolicyBinding{
				Name:   policyBinding.Name,
				Spec:   policyBinding.Spec,
				Status: policyBinding.Status,
			})
		}
	}

	return res, nil
}

func DecodeListPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req listPolicyBindingReq
	req.ProjectID = r.URL.Query().Get("project_id")

	return req, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(getPolicyBindingReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}
	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	if req.ProjectID == "" && !user.IsAdmin {
		return nil, fmt.Errorf("project_id parameter is required for non-admin users.")
	}

	policyBinding, err := provider.GetUnsecured(ctx, req.PolicyBindingName, req.Namespace)

	if err != nil {
		return nil, err
	}

	if policyBinding.Spec.Target.Projects.SelectAll || slices.Contains(policyBinding.Spec.Target.Projects.Name, req.ProjectID) || req.ProjectID == "" {
		return &apiv2.PolicyBinding{
			Name:   policyBinding.Name,
			Spec:   policyBinding.Spec,
			Status: policyBinding.Status,
		}, nil
	}

	return nil, utilerrors.NewNotFound("policy binding not found", req.PolicyBindingName)
}

func DecodeGetPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getPolicyBindingReq

	req.Namespace = mux.Vars(r)["namespace"]
	if req.Namespace == "" {
		return "", fmt.Errorf("'namespace' parameter is required but was not provided")
	}

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	req.ProjectID = r.URL.Query().Get("project_id")

	return req, nil
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(createPolicyBindingReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	userInfo, err := userInfoGetter(ctx, req.Body.ProjectID)

	if err != nil {
		return nil, err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return nil, fmt.Errorf("Only admins and project owners can create policy bindings")
	}
	if !userInfo.IsAdmin {
		if req.Body.Spec.Scope == globalScope {
			return nil, fmt.Errorf("Only admins can create policy binding with global scope")
		}
	}
	if !slices.Contains(req.Body.Spec.Target.Projects.Name, req.Body.ProjectID) && !userInfo.IsAdmin {
		return nil, fmt.Errorf("project owners can only create policybinding on there projects")
	}

	policyBindingSpec := req.Body.Spec.DeepCopy()

	policyBinding := &kubermaticv1.PolicyBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Body.Name,
			Namespace: req.Body.Namespace,
		},
		Spec: *policyBindingSpec,
	}

	created, err := provider.CreateUnsecured(ctx, policyBinding)
	if err != nil {
		return nil, err
	}
	return &apiv2.PolicyBinding{
		Name:   created.Name,
		Spec:   created.Spec,
		Status: created.Status,
	}, nil
}

func DecodeCreatePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req createPolicyBindingReq
	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) (interface{}, error) {
	req, ok := request.(patchPolicyBindingReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	userInfo, err := userInfoGetter(ctx, req.Body.ProjectID)

	if err != nil {
		return nil, err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return nil, fmt.Errorf("Only admins and project owners can update policy bindings")
	}
	if !userInfo.IsAdmin {
		if req.Body.Spec.Scope == globalScope {
			return nil, fmt.Errorf("Only admins can update policy binding with global scope")
		}
	}
	if !slices.Contains(req.Body.Spec.Target.Projects.Name, req.Body.ProjectID) && !userInfo.IsAdmin {
		return nil, fmt.Errorf("project owners can only update policybinding on there projects")
	}

	policyBindingSpec := req.Body.Spec.DeepCopy()
	policyBinding := &kubermaticv1.PolicyBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.PolicyBindingName,
			Namespace: req.Body.Namespace,
		},
		Spec: *policyBindingSpec,
	}

	patchedPolicyBinding, err := provider.PatchUnsecured(ctx, userInfo, policyBinding, req.Body.ProjectID)
	if err != nil {
		return nil, err
	}
	return &apiv2.PolicyBinding{
		Name:   patchedPolicyBinding.Name,
		Spec:   *patchedPolicyBinding.Spec.DeepCopy(),
		Status: patchedPolicyBinding.Status,
	}, nil
}

func DecodePatchPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req patchPolicyBindingReq

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyBindingProvider) error {
	req, ok := request.(deletePolicyBindingReq)
	if !ok {
		return utilerrors.NewBadRequest("invalid request")
	}
	userInfo, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return fmt.Errorf("Only admins and project owners can delete policy template")
	}

	if err := provider.DeleteUnsecured(ctx, userInfo, req.PolicyBindingName, req.Namespace, req.ProjectID); err != nil {
		return err
	}

	return nil
}

func DecodeDeletePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req deletePolicyBindingReq

	req.Namespace = mux.Vars(r)["namespace"]
	if req.Namespace == "" {
		return "", fmt.Errorf("'namespace' parameter is required but was not provided")
	}

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	req.ProjectID = r.URL.Query().Get("project_id")

	return req, nil
}
