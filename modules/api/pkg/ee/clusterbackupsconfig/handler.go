package clusterbackupconfig

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

type cbcBody struct {
	// Name of the cluster backup config
	Name string `json:"name,omitempty"`
	ID   string `json:"id,omitempty"`
	// ClusterBackupConfigSpec Spec of the cluster backup config
	Spec apiv2.ClusterBackupConfigSpec `json:"spec,omitempty"`
}

var projectBackupObjectsArr []cbcBody

func CreateEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	req := request.(createClusterBackupConfigReq)

	res := cbcBody{
		Name: req.Body.Name,
		ID:   uuid.New().String(),
		Spec: apiv2.ClusterBackupConfigSpec{
			ClusterID:   req.Body.Spec.ClusterID,
			Destination: req.Body.Spec.Destination,
			Namespaces:  req.Body.Spec.Namespaces,
			Labels:      req.Body.Spec.Labels,
			Schedule:    req.Body.Spec.Schedule,
			CreatedAt:   time.Now(),
		},
	}

	projectBackupObjectsArr = append(projectBackupObjectsArr, res)

	return res, nil
}

type createClusterBackupConfigReq struct {
	cluster.GetClusterReq
	// in: body
	Body cbcBody
}

func DecodeCreateClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createClusterBackupConfigReq
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

	req := request.(listClusterBackupConfigReq)
	var clusterBackupList []cbcBody

	for _, item := range projectBackupObjectsArr {
		if item.Spec.ClusterID == req.ClusterID {
			clusterBackupList = append(clusterBackupList, item)
		}
	}
	return clusterBackupList, nil

}

type listClusterBackupConfigReq struct {
	cluster.GetClusterReq
}

func DecodeListClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listClusterBackupConfigReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)
	return req, nil
}

func GetEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	req := request.(getClusterBackupConfigReq)

	var responseItem cbcBody

	for _, item := range projectBackupObjectsArr {

		if item.ID == req.ClusterBackupConfigID {
			responseItem = item
		}
	}

	if responseItem.ID == "" {
		return nil, fmt.Errorf("'backup not found'")
	}

	return responseItem, nil
}

type getClusterBackupConfigReq struct {
	cluster.GetClusterReq
	// in: path
	// required: true
	ClusterBackupConfigID string `json:"cbc_id"`
}

func DecodeGetClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getClusterBackupConfigReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterBackupConfigID = mux.Vars(r)["cbc_id"]
	if req.ClusterBackupConfigID == "" {
		return "", fmt.Errorf("'cbc_id' parameter is required but was not provided")
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}) (interface{}, error) {

	req := request.(deleteClusterBackupConfigReq)
	for _, item := range req.Body {
		var filteredProjectBackupObjectsArr []cbcBody

		for _, element := range projectBackupObjectsArr {
			if element.ID != item {
				filteredProjectBackupObjectsArr = append(filteredProjectBackupObjectsArr, element)
			}
		}

		projectBackupObjectsArr = filteredProjectBackupObjectsArr
	}
	return nil, nil

}

type deleteClusterBackupConfigReq struct {
	cluster.GetClusterReq
	// in: body
	Body []string
}

func DecodeDeleteClusterBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteClusterBackupConfigReq
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
	return projectBackupObjectsArr, nil
}

type listProjectClustersBackupConfigReq struct {
	common.ProjectReq
}

func DecodeListProjectClustersBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listProjectClustersBackupConfigReq

	pr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = pr.(common.ProjectReq)

	return req, nil
}
