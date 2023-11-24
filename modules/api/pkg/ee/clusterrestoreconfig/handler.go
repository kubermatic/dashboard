package clusterrestoreconfig

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
)

type rbcBody struct {
	// Name of the cluster backup config
	Name string `json:"name,omitempty"`
	ID   string `json:"id,omitempty"`
	// ClusterRestoreConfigSpec Spec of the cluster backup config
	Spec apiv2.ClusterRestoreConfigSpec `json:"spec,omitempty"`
}

var projectRestoreObjectsArr []rbcBody

func CreateEndpoint(ctx context.Context, request interface{}) (interface{}, error) {

	req := request.(createClusterRestoreConfigReq)

	res := rbcBody{
		Name: req.Body.Name,
		ID:   uuid.New().String(),
		Spec: apiv2.ClusterRestoreConfigSpec{
			Namespaces:        req.Body.Spec.Namespaces,
			ClusterID:         req.Body.Spec.ClusterID,
			BackupName:        req.Body.Spec.BackupName,
			RestoredResources: req.Body.Spec.RestoredResources,
			Resources:         req.Body.Spec.Resources,
			CreatedAt:         time.Now(),
		},
	}

	projectRestoreObjectsArr = append(projectRestoreObjectsArr, res)

	return res, nil
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
	var clusterRestoreList []rbcBody

	for _, item := range projectRestoreObjectsArr {
		if item.Spec.ClusterID == req.ClusterID {
			clusterRestoreList = append(clusterRestoreList, item)
		}
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

func GetEndpoint(ctx context.Context, request interface{}) (interface{}, error) {

	req := request.(getClusterRestoreConfigReq)

	var responseItem rbcBody

	for _, item := range projectRestoreObjectsArr {
		if item.ID == req.ClusterRestoreConfigID {
			responseItem = item
		}
	}

	if responseItem.ID == "" {
		return nil, fmt.Errorf("'restore not found'")
	}

	return responseItem, nil

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

func DeleteEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	req := request.(deleteClusterRestoreConfigReq)
	for _, item := range req.Body {
		var filteredProjectRestoreObjectsArr []rbcBody

		for _, element := range projectRestoreObjectsArr {
			if element.ID != item {
				filteredProjectRestoreObjectsArr = append(filteredProjectRestoreObjectsArr, element)
			}
		}

		projectRestoreObjectsArr = filteredProjectRestoreObjectsArr
	}
	return nil, nil

}

type deleteClusterRestoreConfigReq struct {
	cluster.GetClusterReq
	// in: body
	Body []string
}

func DecodeDeleteClusterRestoreConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteClusterRestoreConfigReq
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
