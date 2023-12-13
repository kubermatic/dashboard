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

package clusterbackup

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"
	veleroclient "github.com/vmware-tanzu/velero/pkg/client"

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

type clusterBackupBody struct {
	// Name of the cluster backup
	Name string `json:"name,omitempty"`
	// Spec of a Velero cluster backup
	Spec velerov1.BackupSpec `json:"spec,omitempty"`
}

const (
	UserClusterBackupNamespace = "velero"
)

type clusterBackupUI struct {
	Name string              `json:"name"`
	ID   string              `json:"id,omitempty"`
	Spec clusterBackupUISpec `json:"spec,omitempty"`
}

type clusterBackupUISpec struct {
	IncludedNamespaces []string              `json:"includedNamespaces,omitempty"`
	StorageLocation    string                `json:"storageLocation,omitempty"`
	ClusterID          string                `json:"clusterid,omitempty"`
	TTL                string                `json:"ttl,omitempty"`
	Labels             *metav1.LabelSelector `json:"labelSelector,omitempty"`
	Status             string                `json:"status,omitempty"`
	CreatedAt          apiv1.Time            `json:"createdAt,omitempty"`
}

func CreateEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {

	if err := isClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}
	req := request.(createClusterBackupReq)

	clusterBackup := &velerov1.Backup{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Body.Name,
			Namespace: UserClusterBackupNamespace,
			Labels:    req.Body.Spec.Labels,
		},
		Spec: *req.Body.Spec.DeepCopy(),
	}
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
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
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {

	if err := isClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(listClusterBackupReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	clusterBackupList := &velerov1.BackupList{}
	if err := client.List(ctx, clusterBackupList, ctrlruntimeclient.InNamespace(UserClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	var uiClusterBackupList []clusterBackupUI

	for _, item := range clusterBackupList.Items {
		uiClusterBackup := clusterBackupUI{
			Name: item.Name,
			ID:   string(item.GetUID()),
			Spec: clusterBackupUISpec{
				IncludedNamespaces: item.Spec.IncludedNamespaces,
				StorageLocation:    item.Spec.StorageLocation,
				ClusterID:          req.ClusterID,
				TTL:                item.Spec.TTL.Duration.String(),
				Labels:             item.Spec.LabelSelector,
				Status:             string(item.Status.Phase),
				CreatedAt:          apiv1.Time(item.GetObjectMeta().GetCreationTimestamp()),
			},
		}
		uiClusterBackupList = append(uiClusterBackupList, uiClusterBackup)
	}
	return uiClusterBackupList, nil
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
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {

	if err := isClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(getClusterBackupReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	clusterBackup := &velerov1.Backup{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.ClusterBackup, Namespace: UserClusterBackupNamespace}, clusterBackup); err != nil {
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
	privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {

	if err := isClusterbackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(deleteClusterBackupReq)
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
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

func submitBackupDeleteRequest(ctx context.Context, client ctrlruntimeclient.Client, clusterBackupID string) error {
	backup := &velerov1.Backup{}

	if err := client.Get(ctx, types.NamespacedName{Name: clusterBackupID, Namespace: UserClusterBackupNamespace}, backup); err != nil {
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

func isClusterbackupEnabled(ctx context.Context, settingsProvider provider.SettingsProvider) error {
	globalSettings, err := settingsProvider.GetGlobalSettings(ctx)

	if err != nil {
		return common.KubernetesErrorToHTTPError(err)
	}

	if !*globalSettings.Spec.EnableClusterBackups {
		return fmt.Errorf("cluster backup feature is disabled by the admin")
	}

	return nil
}
