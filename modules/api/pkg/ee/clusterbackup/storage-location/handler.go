//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2024 Kubermatic GmbH

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

package storagelocation

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

// listCbslReq defines HTTP request for listCbsl
// swagger:parameters listClusterBackupStorageLocation
type listCbslReq struct {
	common.ProjectReq
}

// getCbslReq defines HTTP request for getCbsl
// swagger:parameters getClusterBackupStorageLocation
type getCbslReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterBackupStorageLocationName string `json:"cbsl_name"`
}

// listCbslBucketObjectsReq defines HTTP request for listCbslBucketObjects
// swagger:parameters listClusterBackupStorageLocationBucketObjects
type listCbslBucketObjectsReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterBackupStorageLocationName string `json:"cbsl_name"`
}

// createCbslReq defines HTTP request for createCbsl
// swagger:parameters createClusterBackupStorageLocation
type createCbslReq struct {
	common.ProjectReq
	// in: body
	// required: true
	Body CbslBody
}
type CbslBody struct {
	// Name of the cluster backup
	Name string `json:"name,omitempty"`
	// Spec of a Velero cluster backup
	Credentials apiv2.S3BackupCredentials          `json:"credentials,omitempty"`
	CBSLSpec    velerov1.BackupStorageLocationSpec `json:"cbslSpec,omitempty"`
}

// deleteCbslReq defines HTTP request for deleteCbsl
// swagger:parameters deleteClusterBackupStorageLocation
type deleteCbslReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterBackupStorageLocationName string `json:"cbsl_name"`
}

// patchCbslReq defines HTTP request for patchCbsl
// swagger:parameters patchClusterBackupStorageLocation
type patchCbslReq struct {
	common.ProjectReq
	// in: path
	// required: true
	ClusterBackupStorageLocationName string `json:"cbsl_name"`
	// in: body
	// required: true
	Body CbslBody
}

const (
	displayNameLabelKey = "csbl-display-name"
)

func ListCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) ([]*apiv2.ClusterBackupStorageLocation, error) {
	req, ok := request.(listCbslReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	labelSet := map[string]string{
		kubermaticv1.ProjectIDLabelKey: req.ProjectID,
	}

	cbslList, err := provider.ListUnsecured(ctx, user, labelSet)
	if err != nil {
		return nil, err
	}

	resp := []*apiv2.ClusterBackupStorageLocation{}
	for _, cbsl := range cbslList.Items {
		resp = append(resp, &apiv2.ClusterBackupStorageLocation{
			Name:        cbsl.Name,
			DisplayName: cbsl.Labels[displayNameLabelKey],
			Spec:        *cbsl.Spec.DeepCopy(),
			Status:      *cbsl.Status.DeepCopy(),
		})
	}
	return resp, nil
}

func GetCSBL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	req, ok := request.(getCbslReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	labelSet := map[string]string{
		kubermaticv1.ProjectIDLabelKey: req.ProjectID,
	}

	cbsl, err := provider.GetUnsecured(ctx, user, req.ClusterBackupStorageLocationName, labelSet)
	if err != nil {
		return nil, err
	}

	if cbsl == nil {
		return nil, nil
	}

	return &apiv2.ClusterBackupStorageLocation{
		Name:        cbsl.Name,
		DisplayName: cbsl.Labels[displayNameLabelKey],
		Spec:        *cbsl.Spec.DeepCopy(),
		Status:      *cbsl.Status.DeepCopy(),
	}, nil
}

func ListCSBLBucketObjects(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (apiv2.BackupStorageLocationBucketObjectList, error) {
	req, ok := request.(listCbslBucketObjectsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	if err := common.ValidateUserCanModifyProject(ctx, userInfoGetter, req.ProjectID); err != nil {
		return nil, err
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	labelSet := map[string]string{
		kubermaticv1.ProjectIDLabelKey: req.ProjectID,
	}

	return provider.ListBucketObjects(ctx, user, req.ClusterBackupStorageLocationName, labelSet)
}

func CreateCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	req, ok := request.(createCbslReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	cbslName := req.Body.Name
	cbslSpec := req.Body.CBSLSpec.DeepCopy()
	creds := req.Body.Credentials
	cbsl := &kubermaticv1.ClusterBackupStorageLocation{
		Spec: *cbslSpec,
	}
	created, err := provider.Create(ctx, user, cbslName, req.ProjectID, cbsl, creds)
	if err != nil {
		return nil, err
	}

	return &apiv2.ClusterBackupStorageLocation{
		Name:        created.Name,
		DisplayName: cbsl.Labels[displayNameLabelKey],
		Spec:        *created.Spec.DeepCopy(),
		Status:      *created.Status.DeepCopy(),
	}, nil
}

func DeleteCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) error {
	req, ok := request.(deleteCbslReq)
	if !ok {
		return utilerrors.NewBadRequest("invalid request")
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return err
	}

	err = provider.Delete(ctx, user, req.ClusterBackupStorageLocationName)
	if err != nil {
		return err
	}

	return nil
}

func PatchCBSL(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	req, ok := request.(patchCbslReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	user, err := userInfoGetter(ctx, req.ProjectID)

	if err != nil {
		return nil, err
	}

	cbslSpec := req.Body.CBSLSpec.DeepCopy()
	cbsl := &kubermaticv1.ClusterBackupStorageLocation{
		Spec: *cbslSpec,
	}
	patched, err := provider.Patch(ctx, user, req.ClusterBackupStorageLocationName, cbsl, req.Body.Credentials)
	if err != nil {
		return nil, err
	}

	if err != nil {
		return nil, err
	}

	return &apiv2.ClusterBackupStorageLocation{
		Name:        patched.Name,
		DisplayName: patched.Labels[displayNameLabelKey],
		Spec:        *patched.Spec.DeepCopy(),
		Status:      *patched.Status.DeepCopy(),
	}, nil
}

func DecodeListProjectCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req listCbslReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	return req, nil
}

func DecodeGetCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req getCbslReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	req.ClusterBackupStorageLocationName = mux.Vars(r)["cbsl_name"]
	if req.ClusterBackupStorageLocationName == "" {
		return "", fmt.Errorf("'cbsl_name' parameter is required but was not provided")
	}

	return req, nil
}

func DecodeListCBSLBucketObjectsReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req listCbslBucketObjectsReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	req.ClusterBackupStorageLocationName = mux.Vars(r)["cbsl_name"]
	if req.ClusterBackupStorageLocationName == "" {
		return "", fmt.Errorf("'cbsl_name' parameter is required but was not provided")
	}

	return req, nil
}

func DecodeCreateCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req createCbslReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	if err = json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func DecodeDeleteCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req deleteCbslReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	req.ClusterBackupStorageLocationName = mux.Vars(r)["cbsl_name"]
	if req.ClusterBackupStorageLocationName == "" {
		return "", fmt.Errorf("'cbsl_name' parameter is required but was not provided")
	}

	return req, nil
}

func DecodePatchCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	var req patchCbslReq

	pr, err := common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)
	req.ClusterBackupStorageLocationName = mux.Vars(r)["cbsl_name"]
	if req.ClusterBackupStorageLocationName == "" {
		return "", fmt.Errorf("'cbsl_name' parameter is required but was not provided")
	}
	if err = json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func getCSBLLabels(displayName, projectID string) map[string]string {
	return map[string]string{
		kubermaticv1.ProjectIDLabelKey: projectID,
		displayNameLabelKey:            displayName,
	}
}
