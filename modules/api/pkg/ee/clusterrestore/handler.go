package clusterrestore

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type clusterRestoreBody struct {
	// Name of the cluster backup
	Name string `json:"name,omitempty"`
	// ClusterRestoreSpec Spec of the cluster restore spec
	Spec velerov1.RestoreSpec `json:"spec,omitempty"`
}

type clusterRestoreUI struct {
	Name string               `json:"name"`
	ID   string               `json:"id,omitempty"`
	Spec clusterRestoreUISpec `json:"spec,omitempty"`
}

type clusterRestoreUISpec struct {
	BackupName         string            `json:"backupName"`
	ScheduleName       string            `json:"scheduleName,omitempty"`
	ClusterID          string            `json:"clusterid,omitempty"`
	IncludedNamespaces []string          `json:"includedNamespaces,omitempty"`
	Labels             map[string]string `json:"labels,omitempty"`
	Status             string            `json:"status,omitempty"`
	CreatedAt          apiv1.Time        `json:"createdAt,omitempty"`
}

const (
	userClusterBackupNamespace = "velero"
)

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(createClusterRestoreReq)

	restore := &velerov1.Restore{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Body.Name,
			Namespace: userClusterBackupNamespace,
		},
		Spec: *req.Body.Spec.DeepCopy(),
	}
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	if err := client.Create(ctx, restore); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return &apiv2.ClusterRestore{
		Name: restore.Name,
		Spec: *restore.Spec.DeepCopy(),
	}, nil
}

type createClusterRestoreReq struct {
	cluster.GetClusterReq
	//in: body
	Body clusterRestoreBody
}

func DecodeCreateClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createClusterRestoreReq
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

func ListEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(listClusterRestoreReq)
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	clusterRestoreList := &velerov1.RestoreList{}

	if err := client.List(ctx, clusterRestoreList, ctrlruntimeclient.InNamespace(userClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	var uiClusterRestoreList []clusterRestoreUI

	for _, item := range clusterRestoreList.Items {
		uiClusterRestore := clusterRestoreUI{
			Name: item.Name,
			ID:   string(item.GetUID()),
			Spec: clusterRestoreUISpec{
				BackupName:         item.Spec.BackupName,
				IncludedNamespaces: item.Spec.IncludedNamespaces,
				ClusterID:          req.ClusterID,
				ScheduleName:       item.Spec.ScheduleName,
				Labels:             item.GetObjectMeta().GetLabels(),
				Status:             string(item.Status.Phase),
				CreatedAt:          apiv1.Time(item.GetObjectMeta().GetCreationTimestamp()),
			},
		}
		uiClusterRestoreList = append(uiClusterRestoreList, uiClusterRestore)
	}

	return uiClusterRestoreList, nil

}

type listClusterRestoreReq struct {
	cluster.GetClusterReq
}

func DecodeListClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listClusterRestoreReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)
	return req, nil

}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(getClusterRestoreReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	clusterRestore := &velerov1.Restore{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterRestoreID, Namespace: userClusterBackupNamespace}, clusterRestore); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return clusterRestore, nil

}

type getClusterRestoreReq struct {
	cluster.GetClusterReq
	//in: path
	// required: true
	ClusterRestoreID string `json:"clusterrestore"`
}

func DecodeGetRestoreBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getClusterRestoreReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterRestoreID = mux.Vars(r)["clusterrestore"]
	if req.ClusterRestoreID == "" {
		return nil, fmt.Errorf("'clusterrestore' parameter is required but was not provided")
	}
	return req, nil

}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(deleteClusterRestoreReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	clusterRestore := &velerov1.Restore{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterRestoreID, Namespace: userClusterBackupNamespace}, clusterRestore); err != nil {
		if apierrors.IsNotFound(err) {
			// return nil, nil
		}
		return nil, err
	}
	if err := client.Delete(ctx, clusterRestore); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return nil, nil

}

type deleteClusterRestoreReq struct {
	cluster.GetClusterReq
	// in: body
	ClusterRestoreID string `json:"clusterrestore"`
}

func DecodeDeleteClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteClusterRestoreReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterRestoreID = mux.Vars(r)["clusterrestore"]
	if req.ClusterRestoreID == "" {
		return nil, fmt.Errorf("'clusterrestore' parameter is required but was not provided")
	}
	return req, nil
}
