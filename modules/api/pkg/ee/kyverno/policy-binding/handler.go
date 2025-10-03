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

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

// listPolicyBindingReq defines HTTP request for getting a list of policy bindings
// swagger:parameters listPolicyBinding
type listPolicyBindingReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
}

func (req listPolicyBindingReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// getPolicyBindingReq defines HTTP request for getting a policy binding
// swagger:parameters getPolicyBinding
type getPolicyBindingReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
}

func (req getPolicyBindingReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// createPolicyBindingReq defines HTTP request for creating a policy binding
// swagger:parameters createPolicyBinding
type createPolicyBindingReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
	// in: body
	// required: true
	Body createPolicyBindingBody
}

func (req createPolicyBindingReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// patchPolicyBindingReq defines HTTP request for patching a policy binding
// swagger:parameters patchPolicyBinding
type patchPolicyBindingReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
	// in: body
	// required: true
	Body patchPolicyBindingBody `json:"body"`
}

func (req patchPolicyBindingReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// deletePolicyBindingReq defines HTTP request for deleting a policy binding
// swagger:parameters deletePolicyBinding
type deletePolicyBindingReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterID string `json:"cluster_id"`
	// in: path
	// required: true
	PolicyBindingName string `json:"binding_name"`
}

func (req deletePolicyBindingReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

type createPolicyBindingBody struct {
	Name string                         `json:"name"`
	Spec kubermaticv1.PolicyBindingSpec `json:"spec"`
}

type patchPolicyBindingBody struct {
	Spec kubermaticv1.PolicyBindingSpec
}

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
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

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()
	policyBindingList := &kubermaticv1.PolicyBindingList{}
	namespace := fmt.Sprintf("cluster-%s", req.ClusterID)

	if err := seedClient.List(ctx, policyBindingList, ctrlruntimeclient.InNamespace(namespace)); err != nil {
		return nil, err
	}

	res := []*apiv2.PolicyBinding{}
	for _, policyBinding := range policyBindingList.Items {
		res = append(res, &apiv2.PolicyBinding{
			Name:   policyBinding.Name,
			Spec:   policyBinding.Spec,
			Status: policyBinding.Status,
		})
	}

	return res, nil
}

func DecodeListPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req listPolicyBindingReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	clusterID, err := common.DecodeClusterID(ctx, r)
	if err != nil {
		return nil, err
	}
	req.ClusterID = clusterID

	return req, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
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
	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()
	policyBinding := &kubermaticv1.PolicyBinding{}
	namespace := fmt.Sprintf("cluster-%s", req.ClusterID)
	if err := seedClient.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: req.PolicyBindingName}, policyBinding); err != nil {
		return nil, err
	}

	return &apiv2.PolicyBinding{
		Name:   policyBinding.Name,
		Spec:   policyBinding.Spec,
		Status: policyBinding.Status,
	}, nil
}

func DecodeGetPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getPolicyBindingReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	clusterID, err := common.DecodeClusterID(ctx, r)
	if err != nil {
		return nil, err
	}
	req.ClusterID = clusterID

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	return req, nil
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	req, ok := request.(createPolicyBindingReq)
	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}
	userInfo, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return nil, fmt.Errorf("Only admins and project owners can create policy bindings")
	}

	policyBindingSpec := req.Body.Spec.DeepCopy()

	namespace := fmt.Sprintf("cluster-%s", req.ClusterID)
	policyBinding := &kubermaticv1.PolicyBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Body.Name,
			Namespace: namespace,
		},
		Spec: *policyBindingSpec,
	}
	if err := seedClient.Create(ctx, policyBinding); err != nil {
		return nil, err
	}

	return &apiv2.PolicyBinding{
		Name:   policyBinding.Name,
		Spec:   policyBinding.Spec,
		Status: policyBinding.Status,
	}, nil
}

func DecodeCreatePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req createPolicyBindingReq
	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	clusterID, err := common.DecodeClusterID(ctx, r)
	if err != nil {
		return nil, err
	}
	req.ClusterID = clusterID

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) (interface{}, error) {
	req, ok := request.(patchPolicyBindingReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	userInfo, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	if !userInfo.Roles.Has("owners") && !userInfo.IsAdmin {
		return nil, fmt.Errorf("Only admins and project owners can update policy bindings")
	}

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()

	policyBindingSpec := req.Body.Spec.DeepCopy()
	namespace := fmt.Sprintf("cluster-%s", req.ClusterID)

	existing := &kubermaticv1.PolicyBinding{}
	if err := seedClient.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: req.PolicyBindingName}, existing); err != nil {
		return nil, err
	}

	updated := existing.DeepCopy()
	updated.Spec = *policyBindingSpec

	if err := seedClient.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing)); err != nil {
		return nil, err
	}

	return &apiv2.PolicyBinding{
		Name:   updated.Name,
		Spec:   *updated.Spec.DeepCopy(),
		Status: updated.Status,
	}, nil
}

func DecodePatchPolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req patchPolicyBindingReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	clusterID, err := common.DecodeClusterID(ctx, r)
	if err != nil {
		return nil, err
	}
	req.ClusterID = clusterID

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter) error {
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

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()

	namespace := fmt.Sprintf("cluster-%s", req.ClusterID)

	existing := &kubermaticv1.PolicyBinding{}
	if err := seedClient.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: req.PolicyBindingName}, existing); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return err
	}

	if err := seedClient.Delete(ctx, existing); err != nil {
		return err
	}

	return nil
}

func DecodeDeletePolicyBindingReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req deletePolicyBindingReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	clusterID, err := common.DecodeClusterID(ctx, r)
	if err != nil {
		return nil, err
	}
	req.ClusterID = clusterID

	req.PolicyBindingName = mux.Vars(r)["binding_name"]
	if req.PolicyBindingName == "" {
		return "", fmt.Errorf("'binding_name' parameter is required but was not provided")
	}

	return req, nil
}
