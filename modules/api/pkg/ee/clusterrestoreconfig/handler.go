package clusterrestoreconfig

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

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

type rbcBody struct {
	// Name of the cluster backup config
	Name string `json:"name,omitempty"`
	// ClusterRestoreConfigSpec Spec of the cluster backup config
	Spec velerov1.RestoreSpec `json:"spec,omitempty"`
}

var projectRestoreObjectsArr []rbcBody

const (
	userClusterBackupNamespace = "velero"
)

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(createClusterRestoreConfigReq)

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

type createClusterRestoreConfigReq struct {
	cluster.GetClusterReq
	//in: body
	Body rbcBody
}

func DecodeCreateClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createClusterRestoreConfigReq
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
	req := request.(listClusterRestoreConfigReq)
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	clusterRestoreList := &velerov1.RestoreList{}

	if err := client.List(ctx, clusterRestoreList, ctrlruntimeclient.InNamespace(userClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	return clusterRestoreList, nil

}

type listClusterRestoreConfigReq struct {
	cluster.GetClusterReq
}

func DecodeListClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listClusterRestoreConfigReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)
	return req, nil

}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(getClusterRestoreConfigReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	clusterRestore := &velerov1.Restore{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterRestoreConfigID, Namespace: userClusterBackupNamespace}, clusterRestore); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return clusterRestore, nil

}

type getClusterRestoreConfigReq struct {
	cluster.GetClusterReq
	//in: path
	// required: true
	ClusterRestoreConfigID string `json:"rbc_id"`
}

func DecodeGetRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getClusterRestoreConfigReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterRestoreConfigID = mux.Vars(r)["rbc_id"]
	if req.ClusterRestoreConfigID == "" {
		return nil, fmt.Errorf("'rbc_id' parameter is required but was not provided")
	}
	return req, nil

}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(deleteClusterRestoreConfigReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	clusterRestore := &velerov1.Restore{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterRestoreConfigID, Namespace: userClusterBackupNamespace}, clusterRestore); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}
	if err := client.Delete(ctx, clusterRestore); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return nil, nil

}

type deleteClusterRestoreConfigReq struct {
	cluster.GetClusterReq
	// in: body
	ClusterRestoreConfigID string `json:"rbc_id"`
}

func DecodeDeleteClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteClusterRestoreConfigReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterRestoreConfigID = mux.Vars(r)["rbc_id"]
	if req.ClusterRestoreConfigID == "" {
		return nil, fmt.Errorf("'rbc_id' parameter is required but was not provided")
	}
	return req, nil
}

func ProjectListEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return projectRestoreObjectsArr, nil
}

type listProjectClustersRestoreConfigReq struct {
	common.ProjectReq
}

func DecodeListProjectClustersRestoreBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listProjectClustersRestoreConfigReq

	pr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	return req, nil
}
