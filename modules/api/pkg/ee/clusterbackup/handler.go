package clusterbackup

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"
	veleroclient "github.com/vmware-tanzu/velero/pkg/client"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type clusterBackupBody struct {
	// Name of the cluster backup config
	Name string `json:"name,omitempty"`
	// ClusterBackupSpec Spec of a velero backup cluster backup config
	Spec velerov1.BackupSpec `json:"spec,omitempty"`
}

const (
	userClusterBackupNamespace = "velero"
)

var projectBackupObjectsArr []clusterBackupBody

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(createClusterBackupReq)

	clusterBackup := &velerov1.Backup{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Body.Name,
			Namespace: userClusterBackupNamespace,
		},
		Spec: *req.Body.Spec.DeepCopy(),
	}
	client, err := getClusterClient(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	if err := client.Create(ctx, clusterBackup); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return &apiv2.ClusterBackup{
		Name: clusterBackup.Name,
		Spec: *clusterBackup.Spec.DeepCopy(),
	}, nil
}

type createClusterBackupReq struct {
	cluster.GetClusterReq
	// in: body
	Body clusterBackupBody
}

func DecodeCreateClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createClusterBackupReq
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
	req := request.(listClusterBackupReq)

	client, err := getClusterClient(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	clusterBackupList := &velerov1.BackupList{}
	if err := client.List(ctx, clusterBackupList, ctrlruntimeclient.InNamespace(userClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return clusterBackupList, nil
}

type listClusterBackupReq struct {
	cluster.GetClusterReq
}

func DecodeListClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listClusterBackupReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)
	return req, nil
}

func GetEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(getClusterBackupReq)

	client, err := getClusterClient(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	clusterBackup := &velerov1.Backup{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterBackup, Namespace: userClusterBackupNamespace}, clusterBackup); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return clusterBackup, nil
}

type getClusterBackupReq struct {
	cluster.GetClusterReq
	// in: path
	// required: true
	ClusterBackup string `json:"clusterBackup"`
}

func DecodeGetClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getClusterBackupReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterBackup = mux.Vars(r)["clusterBackup"]
	if req.ClusterBackup == "" {
		return "", fmt.Errorf("'clusterBackup' parameter is required but was not provided")
	}

	return req, nil
}

func DeleteEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	req := request.(deleteClusterBackupReq)
	client, err := getClusterClient(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	if err := submitBackupDeleteRequest(ctx, client, req.ClusterBackup); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return nil, nil
}

type deleteClusterBackupReq struct {
	cluster.GetClusterReq
	// in: path
	// required: true
	ClusterBackup string `json:"clusterBackup"`
}

func DecodeDeleteClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteClusterBackupReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.ClusterBackup = mux.Vars(r)["clusterBackup"]
	if req.ClusterBackup == "" {
		return "", fmt.Errorf("'clusterBackup' parameter is required but was not provided")
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

func getClusterClient(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, projectID, clusterID string) (ctrlruntimeclient.Client, error) {
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)
	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, nil)
	if err != nil {
		return nil, err
	}

	client, err := common.GetClusterClient(ctx, userInfoGetter, clusterProvider, cluster, projectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return client, nil
}

func submitBackupDeleteRequest(ctx context.Context, client ctrlruntimeclient.Client, clusterBackupID string) error {
	backup := &velerov1.Backup{}
	if err := client.Get(ctx, types.NamespacedName{Name: clusterBackupID, Namespace: userClusterBackupNamespace}, backup); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return err
	}

	delReq := &velerov1.DeleteBackupRequest{
		TypeMeta: metav1.TypeMeta{
			APIVersion: velerov1.SchemeGroupVersion.String(),
			Kind:       "DeleteBackupRequest",
		},
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: fmt.Sprintf("%s-", backup.Name),
			Namespace:    backup.Namespace,
			Labels: map[string]string{
				velerov1.BackupNameLabel: backup.Name,
				velerov1.BackupUIDLabel:  string(backup.UID),
			},
		},
		Spec: velerov1.DeleteBackupRequestSpec{
			BackupName: backup.Name,
		},
	}
	print(delReq)
	return veleroclient.CreateRetryGenerateName(client, ctx, delReq)
}
