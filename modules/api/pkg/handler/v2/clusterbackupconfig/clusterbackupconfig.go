package clusterbackupconfig

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
)

const (
	automaticBackup = "automatic"
	snapshot        = "snapshot"
)

var clusterBackupObjectsArr []cbcBody

func CreateEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(createClusterBackupConfigReq)

		res := cbcBody{
			Name: req.Body.Name,
			ID:   uuid.New().String(),
			Spec: apiv2.ClusterBackupConfigSpec{
				Cluster:     req.Body.Spec.Cluster,
				Destination: req.Body.Spec.Destination,
				Namespaces:  req.Body.Spec.Namespaces,
				Labels:      req.Body.Spec.Labels,
			},
		}

		clusterBackupObjectsArr = append(clusterBackupObjectsArr, res)

		return res, nil
	}
}

type createClusterBackupConfigReq struct {
	cluster.GetClusterReq
	// in: body
	Body cbcBody
}

type cbcBody struct {
	// Name of the cluster backup config
	Name string `json:"name,omitempty"`
	ID   string
	// ClusterBackupConfigSpec Spec of the cluster backup config
	Spec apiv2.ClusterBackupConfigSpec `json:"spec,omitempty"`
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

func ListEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(listClusterBackupConfigReq)
		var filterdList []cbcBody

		c, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, req.ProjectID, req.ClusterID, nil)
		if err != nil {
			return nil, err
		}

		for _, item := range clusterBackupObjectsArr {
			if item.Spec.Cluster == c.Spec.HumanReadableName {
				filterdList = append(filterdList, item)
			}
		}
		return filterdList, nil
	}
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

func GetEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(getClusterBackupConfigReq)

		var responseItem cbcBody

		for _, item := range clusterBackupObjectsArr {

			if item.ID == req.ClusterBackupConfigID {
				responseItem = item
			}
		}

		return responseItem, nil
	}
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

func DeleteEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(getClusterBackupConfigReq)
		var newClusterBackupsList []cbcBody
		for _, item := range clusterBackupObjectsArr {

			if item.ID != req.ClusterBackupConfigID {
				newClusterBackupsList = append(newClusterBackupsList, item)
			}

		}

		clusterBackupObjectsArr = newClusterBackupsList

		return nil, nil

	}
}

func ProjectListEndpoint() endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {

		return clusterBackupObjectsArr, nil

	}
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
