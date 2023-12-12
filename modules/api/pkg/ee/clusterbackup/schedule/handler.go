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

package clusterbackupschedule

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type cbsBody struct {
	// Name of the cluster backup schedule
	Name string `json:"name,omitempty"`
	// Spec of a Velero backup schedule
	Spec velerov1.ScheduleSpec `json:"spec,omitempty"`
}

type clusterScheduleBackupUI struct {
	Name string                      `json:"name"`
	ID   string                      `json:"id,omitempty"`
	Spec clusterScheduleBackupUISpec `json:"spec,omitempty"`
}

type clusterScheduleBackupUISpec struct {
	IncludedNamespaces []string              `json:"includedNamespaces,omitempty"`
	StorageLocation    string                `json:"storageLocation,omitempty"`
	ClusterID          string                `json:"clusterid,omitempty"`
	TTL                string                `json:"ttl,omitempty"`
	Schedule           string                `json:"schedule"`
	Labels             *metav1.LabelSelector `json:"labelSelector,omitempty"`
	Status             string                `json:"status,omitempty"`
	CreatedAt          apiv1.Time            `json:"createdAt,omitempty"`
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(createClusterBackupScheduleReq)

	backupSchedule := &velerov1.Schedule{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Body.Name,
			Namespace: clusterbackup.UserClusterBackupNamespace,
		},
		Spec: *req.Body.Spec.DeepCopy(),
	}
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	if err := client.Create(ctx, backupSchedule); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return &apiv2.ClusterBackupSchedule{
		Name: backupSchedule.Name,
		Spec: *backupSchedule.Spec.DeepCopy(),
	}, nil
}

type createClusterBackupScheduleReq struct {
	cluster.GetClusterReq
	// in: body
	Body cbsBody
}

func DecodeCreateClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createClusterBackupScheduleReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	if err = json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(listClusterBackupScheduleReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	scheduleList := &velerov1.ScheduleList{}
	if err := client.List(ctx, scheduleList, ctrlruntimeclient.InNamespace(clusterbackup.UserClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	var uiScheduleBackupList []clusterScheduleBackupUI

	for _, item := range scheduleList.Items {
		uiScheduleBackup := clusterScheduleBackupUI{
			Name: item.Name,
			ID:   string(item.GetUID()),
			Spec: clusterScheduleBackupUISpec{
				Schedule:           item.Spec.Schedule,
				IncludedNamespaces: item.Spec.Template.IncludedNamespaces,
				StorageLocation:    item.Spec.Template.StorageLocation,
				ClusterID:          req.ClusterID,
				TTL:                item.Spec.Template.TTL.OpenAPISchemaFormat(),
				Labels:             item.Spec.Template.LabelSelector,
				Status:             string(item.Status.Phase),
				CreatedAt:          apiv1.Time(item.GetObjectMeta().GetCreationTimestamp()),
			},
		}
		uiScheduleBackupList = append(uiScheduleBackupList, uiScheduleBackup)
	}

	return uiScheduleBackupList, nil
}

type listClusterBackupScheduleReq struct {
	cluster.GetClusterReq
}

func DecodeListClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listClusterBackupScheduleReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)
	return req, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(getClusterBackupScheduleReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	backupSchedule := &velerov1.Schedule{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterBackupScheduleID, Namespace: clusterbackup.UserClusterBackupNamespace}, backupSchedule); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return backupSchedule, nil
}

type getClusterBackupScheduleReq struct {
	cluster.GetClusterReq
	// in: path
	// required: true
	ClusterBackupScheduleID string `json:"clusterBackupSchedule"`
}

func DecodeGetClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getClusterBackupScheduleReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterBackupScheduleID = mux.Vars(r)["clusterBackupSchedule"]
	if req.ClusterBackupScheduleID == "" {
		return "", fmt.Errorf("'clusterBackupSchedule' parameter is required but was not provided")
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(deleteClusterBackupScheduleReq)
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	backupSchedule := &velerov1.Schedule{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterBackupScheduleID, Namespace: clusterbackup.UserClusterBackupNamespace}, backupSchedule); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}
	if err := client.Delete(ctx, backupSchedule); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return nil, nil
}

type deleteClusterBackupScheduleReq struct {
	cluster.GetClusterReq
	// in: path
	// required: true
	ClusterBackupScheduleID string `json:"clusterBackupSchedule"`
}

func DecodeDeleteClusterBackupScheduleReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteClusterBackupScheduleReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterBackupScheduleID = mux.Vars(r)["clusterBackupSchedule"]
	if req.ClusterBackupScheduleID == "" {
		return "", fmt.Errorf("'clusterBackupSchedule' parameter is required but was not provided")
	}
	return req, nil
}
