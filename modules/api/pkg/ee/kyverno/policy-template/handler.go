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
	"k8c.io/dashboard/v2/pkg/kubernetes"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// listPolicyTemplateReq defines HTTP request for getting a list of policy templates
// swagger:parameters listPolicyTemplate
type listPolicyTemplateReq struct {
	// in: query
	ProjectID string `json:"project_id,omitempty"`
}

// getPolicyTemplateReq defines HTTP request for getting a policy template
// swagger:parameters getPolicyTemplate
type getPolicyTemplateReq struct {
	// in: path
	// required: true
	PolicyTemplateName string `json:"template_name"`
	// in: query
	ProjectID string `json:"project_id,omitempty"`
}

// createPolicyTemplateReq defines HTTP request for creating a policy template
// swagger:parameters createPolicyTemplate
type createPolicyTemplateReq struct {
	// in: body
	// required: true
	Body apiv2.PolicyTemplate
}

// patchPolicyTemplateReq defines HTTP request for patching a policy template
// swagger:parameters patchpolicyTemplate
type patchPolicyTemplateReq struct {
	// in: path
	// required: true
	PolicyTemplateName string `json:"template_name"`
	// in: body
	// required: true
	Spec kubermaticv1.PolicyTemplateSpec `json:"spec"`
}

// deletePolicyTemplateReq defines HTTP request for deleting a policy template
// swagger:parameters deletePolicyTemplate
type deletePolicyTemplateReq struct {
	// in: path
	// required: true
	PolicyTemplateName string `json:"template_name"`
	// in: query
	ProjectID string `json:"project_id,omitempty"`
}

const (
	globalVisibility  = "Global"
	projectVisibility = "Project"
)

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.PrivilegedProjectProvider, provider provider.PolicyTemplateProvider) (interface{}, error) {
	req, ok := request.(listPolicyTemplateReq)
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
	policyTemplateList, err := provider.ListUnsecured(ctx)
	if err != nil {
		return nil, err
	}

	res := []*apiv2.PolicyTemplate{}
	if req.ProjectID == "" {
		for _, policyTemplate := range policyTemplateList.Items {
			if policyTemplate.Spec.Visibility == globalVisibility {
				res = append(res, &apiv2.PolicyTemplate{
					Name: policyTemplate.Name,
					Spec: *policyTemplate.Spec.DeepCopy(),
				})
			}
		}
	} else {
		project, err := projectProvider.GetUnsecured(ctx, req.ProjectID, nil)

		if err != nil {
			return nil, err
		}

		for _, policyTemplate := range policyTemplateList.Items {
			if (req.ProjectID == policyTemplate.Spec.ProjectID && policyTemplate.Spec.Visibility == projectVisibility) || ((HasCommonLabel(policyTemplate.Spec.Target, project.Labels)) && policyTemplate.Spec.Visibility == globalVisibility) {
				res = append(res, &apiv2.PolicyTemplate{
					Name: policyTemplate.Name,
					Spec: *policyTemplate.Spec.DeepCopy(),
				})
			}
		}
	}

	return res, nil
}

func DecodeListPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req listPolicyTemplateReq
	req.ProjectID = r.URL.Query().Get("project_id")

	return req, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	req, ok := request.(getPolicyTemplateReq)
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
	policyTemplate, err := provider.GetUnsecured(ctx, req.PolicyTemplateName)

	if err != nil {
		return nil, err
	}

	if req.ProjectID == "" || policyTemplate.Spec.ProjectID == req.ProjectID || policyTemplate.Spec.Visibility == globalVisibility {
		return &apiv2.PolicyTemplate{
			Name: policyTemplate.Name,
			Spec: *policyTemplate.Spec.DeepCopy(),
		}, nil
	}

	return nil, utilerrors.NewNotFound("policy template not found", req.PolicyTemplateName)
}

func DecodeGetPolicyTemplateReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getPolicyTemplateReq

	req.PolicyTemplateName = mux.Vars(r)["template_name"]
	if req.PolicyTemplateName == "" {
		return "", fmt.Errorf("'template_name' parameter is required but was not provided")
	}

	req.ProjectID = r.URL.Query().Get("project_id")

	return req, nil
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	req, ok := request.(createPolicyTemplateReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	if req.Body.Spec.ProjectID == "" && req.Body.Spec.Visibility == "Project" {
		return nil, fmt.Errorf("ProjectID is required for Project visibility")
	}

	selector := req.Body.Spec.Target.ProjectSelector
	if req.Body.Spec.ProjectID != "" && !kubernetes.IsEmptySelector(selector) {
		return nil, fmt.Errorf("cannot use projectSelector when projectID is specified")
	}

	userInfo, err := userInfoGetter(ctx, req.Body.Spec.ProjectID)

	if err != nil {
		return nil, err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return nil, fmt.Errorf("Only admins and project owners can create policy template")
	}
	if !userInfo.IsAdmin {
		if req.Body.Spec.Visibility == globalVisibility {
			return nil, fmt.Errorf("Only admins can create policy template with global visibility")
		}
	}

	policyTemplateSpec := req.Body.Spec.DeepCopy()

	if policyTemplateSpec == nil {
		return nil, fmt.Errorf("policyTemplateSpec is nil")
	}

	policyTemplate := &kubermaticv1.PolicyTemplate{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Body.Name,
		},
		Spec: *policyTemplateSpec,
	}

	created, err := provider.CreateUnsecured(ctx, policyTemplate)
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
	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.PolicyTemplateProvider) (interface{}, error) {
	req, ok := request.(patchPolicyTemplateReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	selector := req.Spec.Target.ProjectSelector
	if req.Spec.ProjectID != "" && !kubernetes.IsEmptySelector(selector) {
		return nil, fmt.Errorf("cannot use projectSelector when projectID is specified")
	}

	userInfo, err := userInfoGetter(ctx, req.Spec.ProjectID)

	if err != nil {
		return nil, err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return nil, fmt.Errorf("Only admins and project owners can update policy template")
	}
	if !userInfo.IsAdmin {
		if req.Spec.Visibility == globalVisibility {
			return nil, fmt.Errorf("Only admins can update policy template to global visibility")
		}
	}

	policyTemplate := &kubermaticv1.PolicyTemplate{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.PolicyTemplateName,
		},
		Spec: req.Spec,
	}

	patchedPolicyTemplate, err := provider.PatchUnsecured(ctx, userInfo, policyTemplate)
	if err != nil {
		return nil, err
	}

	return &apiv2.PolicyTemplate{
		Name: patchedPolicyTemplate.Name,
		Spec: *patchedPolicyTemplate.Spec.DeepCopy(),
	}, err
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

	userInfo, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return fmt.Errorf("Only admins and project owners can delete policy template")
	}

	if err := provider.DeleteUnsecured(ctx, req.PolicyTemplateName, req.ProjectID, userInfo); err != nil {
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

	req.ProjectID = r.URL.Query().Get("project_id")

	return req, nil
}

func HasCommonLabel(target *kubermaticv1.PolicyTemplateTarget, projectLabel map[string]string) bool {
	if target == nil || IsLabelSelectorEmpty(target.ProjectSelector) {
		return true
	}

	for key, val := range target.ProjectSelector.MatchLabels {
		if projectVal, exists := projectLabel[key]; exists && projectVal == val {
			return true
		}
	}
	return false
}

func IsLabelSelectorEmpty(selector *metav1.LabelSelector) bool {
	if selector == nil {
		return true
	}
	return len(selector.MatchLabels) == 0 && len(selector.MatchExpressions) == 0
}
