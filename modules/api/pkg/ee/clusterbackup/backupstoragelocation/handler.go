//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2023 Kubermatic GmbH

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

package backupstoragelocation

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"
	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
)

type backupStorageLocationBody struct {
	// Name of the cluster backup
	Name string `json:"name,omitempty"`
	ID   string `json:"id,omitempty"`
	// Spec of a Velero backup storage location
	Spec velerov1.BackupStorageLocationSpec `json:"spec,omitempty"`
}

var allBackupStorageLocation []backupStorageLocationBody

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(createBackupStorageLocationReq)

	backupStorageLocation := backupStorageLocationBody{
		Name: req.Body.Name,
		ID:   uuid.New().String(),
		Spec: *req.Body.Spec.DeepCopy(),
	}

	allBackupStorageLocation = append(allBackupStorageLocation, backupStorageLocation)

	return backupStorageLocation, nil

}

type createBackupStorageLocationReq struct {
	common.ProjectReq
	//in: body
	Body backupStorageLocationBody
}

func DecodeCreateBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createBackupStorageLocationReq
	bsl, err := common.DecodeProjectRequest(c, r)

	if err != nil {
		return nil, err
	}
	req.ProjectReq = bsl.(common.ProjectReq)

	if err = json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}
	return allBackupStorageLocation, nil
}

type listBackupStorageLocationReq struct {
	common.ProjectReq
}

func DecodeListBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listBackupStorageLocationReq
	bsl, err := common.DecodeProjectRequest(c, r)

	if err != nil {
		return nil, err
	}

	req.ProjectReq = bsl.(common.ProjectReq)

	return req, nil

}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(getBackupStorageLocationReq)
	var resItem backupStorageLocationBody

	for _, item := range allBackupStorageLocation {
		if item.ID == req.BackupStorageLocationID {
			resItem = item
		}

	}
	if resItem.ID == "" {
		return nil, fmt.Errorf("BSL not found")
	}

	return resItem, nil
}

type getBackupStorageLocationReq struct {
	common.ProjectReq
	// in: path
	// required: true
	BackupStorageLocationID string `json:"bsl_id"`
}

func DecodeGetBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getBackupStorageLocationReq
	bsl, err := common.DecodeProjectRequest(c, r)

	if err != nil {
		return nil, err
	}

	req.ProjectReq = bsl.(common.ProjectReq)

	req.BackupStorageLocationID = mux.Vars(r)["bsl_id"]
	if req.BackupStorageLocationID == "" {
		return "", fmt.Errorf("'bsl_id' parameter is required but was not provided")
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	req := request.(getBackupStorageLocationReq)
	var filteredBackupStorageLocation []backupStorageLocationBody
	for _, item := range allBackupStorageLocation {
		if item.ID != req.BackupStorageLocationID {
			filteredBackupStorageLocation = append(filteredBackupStorageLocation, item)
		}
	}
	allBackupStorageLocation = filteredBackupStorageLocation
	return nil, nil
}

func DecodeDeleteBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getBackupStorageLocationReq
	bsl, err := common.DecodeProjectRequest(c, r)

	if err != nil {
		return nil, err
	}

	req.ProjectReq = bsl.(common.ProjectReq)

	req.BackupStorageLocationID = mux.Vars(r)["bsl_id"]
	if req.BackupStorageLocationID == "" {
		return "", fmt.Errorf("'bsl_id' parameter is required but was not provided")
	}

	return req, nil
}

func PatchEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(patchBackupStorageLocationReq)
	var resItem backupStorageLocationBody

	for idx, item := range allBackupStorageLocation {
		if item.ID == req.BackupStorageLocationID {
			allBackupStorageLocation[idx].Spec = req.Body
			resItem = allBackupStorageLocation[idx]
		}
	}
	if resItem.ID == "" {
		return nil, fmt.Errorf("BSL not found")
	}

	return resItem, nil
}

type patchBackupStorageLocationReq struct {
	common.ProjectReq
	// in: path
	// required: true
	BackupStorageLocationID string `json:"bsl_id"`
	//in: body
	Body velerov1.BackupStorageLocationSpec
}

func DecodePatchBackupStorageLocationReq(c context.Context, r *http.Request) (interface{}, error) {
	var req patchBackupStorageLocationReq
	bsl, err := common.DecodeProjectRequest(c, r)

	if err != nil {
		return nil, err
	}
	req.ProjectReq = bsl.(common.ProjectReq)

	req.BackupStorageLocationID = mux.Vars(r)["bsl_id"]
	if req.BackupStorageLocationID == "" {
		return "", fmt.Errorf("'bsl_id' parameter is required but was not provided")
	}

	if err = json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}
