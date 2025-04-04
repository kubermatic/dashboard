//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2025 Kubermatic GmbH

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
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"text/template"
	"time"

	uuid2 "github.com/google/uuid"
	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	clusterbackupresources "k8c.io/kubermatic/v2/pkg/ee/cluster-backup/user-cluster/velero-controller/resources"
	"k8c.io/kubermatic/v2/pkg/log"
	"k8c.io/kubermatic/v2/pkg/resources"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	supportedVeleroPlugin   = "aws"
	accessKeyTemplate       = "awsAccessKeyId"
	secretAccessKeyTemplate = "awsSecretAccessKey"
	clusterIdLabelKey       = "cluster-id"
	bslRegion               = "region"
	bslKind                 = "BackupStorageLocation"
	CBSL                    = "cbsl"
	backupSyncPeriod        = 30 * time.Second
)

var credentialsTemplate string = `[default]
aws_access_key_id = {{ .awsAccessKeyId }}
aws_secret_access_key = {{ .awsSecretAccessKey }}
`

// createBSLReq defines HTTP request to create BSL in a user cluster
// swagger:parameters createBackupStorageLocation
type createBSLReq struct {
	cluster.GetClusterReq

	// in: body
	// required: true
	Body BSLBody
}

type BSLBody struct {
	CBSLName string `json:"cbslName"`

	BSLSpec velerov1.BackupStorageLocationSpec `json:"bslSpec"`
}

func DecodeCreateBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	var req createBSLReq
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

func (r *createBSLReq) validateCreateBSLReq() error {
	bslSpec := r.Body.BSLSpec
	if bslSpec.Provider != supportedVeleroPlugin {
		return fmt.Errorf("velero plugin not supported other than aws")
	}
	if r.Body.CBSLName == "" {
		return fmt.Errorf("a valid CBSL must be provided for the BSL to be created in the cluster for importing backups")
	}
	return nil
}

func CreateBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, backupProvider provider.BackupStorageProvider, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (*apiv2.BackupStorageLocation, error) {
	req := request.(createBSLReq)
	if err := common.ValidateUserCanModifyProject(ctx, userInfoGetter, req.ProjectID); err != nil {
		return nil, err
	}

	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	if err := req.validateCreateBSLReq(); err != nil {
		return nil, utilerrors.NewBadRequest("%v", err)
	}

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	bsl := &velerov1.BackupStorageLocation{
		Spec: req.Body.BSLSpec,
	}

	// We configure the BSL to be read-only to prevent any accidental/intentional write operations against the storage location.
	bsl.Spec.AccessMode = velerov1.BackupStorageLocationAccessModeReadOnly
	// We don't want the BSL to be the default BSL for the cluster.
	bsl.Spec.Default = false
	// Backup sync period can't be zero, otherwise backup won't be synced from s3
	if bsl.Spec.BackupSyncPeriod.Duration == 0 {
		bsl.Spec.BackupSyncPeriod.Duration = backupSyncPeriod
	}

	bsl, err = createBSL(ctx, client, backupProvider, req.Body.CBSLName, req.ProjectID, req.ClusterID, bsl, nil, bsl.Spec.Credential.Name)
	if err != nil {
		return nil, err
	}

	res := &apiv2.BackupStorageLocation{
		Name:     bsl.Name,
		CBSLName: bsl.Annotations[CBSL],
		Spec:     bsl.Spec,
		Status:   bsl.Status,
	}
	return res, nil
}

func createBSL(ctx context.Context, client ctrlruntimeclient.Client, backupProvider provider.BackupStorageProvider, cbslName, projectID, clusterID string, bsl *velerov1.BackupStorageLocation, credentials *apiv2.BackupCredentials, secretRefName string) (*velerov1.BackupStorageLocation, error) {
	uuid, _ := uuid2.NewUUID()
	uuidStr := strings.ToLower(uuid.String())
	bslFullName := fmt.Sprintf("%s-%s-%s", cbslName, clusterID, uuidStr[:6])
	existingSecret := true
	secret := &corev1.Secret{}
	if err := client.Get(ctx, types.NamespacedName{Name: secretRefName, Namespace: clusterbackup.UserClusterBackupNamespace}, secret); err != nil {
		log.Logger.Errorf("secret doesn't exist for ref: %s in the cluster, creating new secret", secretRefName)
		if !apierrors.IsNotFound(err) {
			return nil, err
		}
		if apierrors.IsNotFound(err) || secret.Name == "" {
			existingSecret = false
			dataBytes, err := backupProvider.GetStorageLocationCreds(ctx, secretRefName)
			if err != nil {
				return nil, fmt.Errorf("please provide correct credentials, error: %v", err.Error())
			}
			if dataBytes[resources.AWSAccessKeyID] == nil || dataBytes[resources.AWSSecretAccessKey] == nil {
				return nil, fmt.Errorf("BSL credentials secret is not set correctly")
			}
			cloudCreds, err := getVeleroCloudCredentials(dataBytes[resources.AWSAccessKeyID], dataBytes[resources.AWSSecretAccessKey])
			if err != nil {
				return nil, fmt.Errorf("failed to generate Velero cloud-credentials template: %w", err)
			}
			if bsl.Spec.Credential.Key == "" {
				bsl.Spec.Credential.Key = resources.ClusterCloudCredentialsSecretName
			}
			secret = &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretRefName,
					Namespace: clusterbackup.UserClusterBackupNamespace,
					Labels:    getBSLLabels(bslFullName, projectID, clusterID),
				},
				Data: map[string][]byte{
					bsl.Spec.Credential.Key: cloudCreds,
				},
			}
		}
	}

	bsl.ObjectMeta = metav1.ObjectMeta{
		Name:      bslFullName,
		Namespace: clusterbackup.UserClusterBackupNamespace,
		Labels:    getBSLLabels(cbslName, projectID, clusterID),
	}

	if !existingSecret {
		bsl.Spec.Credential = &corev1.SecretKeySelector{
			LocalObjectReference: corev1.LocalObjectReference{
				Name: secret.Name,
			},
			Key: resources.ClusterCloudCredentialsSecretName,
		}
	}

	if err := client.Create(ctx, bsl); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	ownerReferences := metav1.OwnerReference{
		APIVersion: velerov1.SchemeGroupVersion.String(),
		Kind:       bslKind,
		Name:       bslFullName,
		UID:        bsl.UID,
	}
	if !existingSecret {
		secret.OwnerReferences = append(secret.OwnerReferences, ownerReferences)
		if err := client.Create(ctx, secret); err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
	} else {
		ownerRefExist := false
		for _, ownerRef := range secret.OwnerReferences {
			if ownerRef.UID == bsl.UID {
				ownerRefExist = true
				break
			}
		}
		if !ownerRefExist {
			updatedSecret := secret.DeepCopy()
			updatedSecret.OwnerReferences = append(updatedSecret.OwnerReferences, ownerReferences)
			if err := client.Patch(ctx, updatedSecret, ctrlruntimeclient.MergeFrom(secret)); err != nil {
				return nil, common.KubernetesErrorToHTTPError(err)
			}
		}
	}
	return bsl, nil
}

// getBSLReq defines HTTP request to get a BSL object from a user cluster
// swagger:parameters getBackupStorageLocation
type getBSLReq struct {
	cluster.GetClusterReq

	// in: path
	// required: true
	BSLName string `json:"bsl_name"`
}

func DecodeGetBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getBSLReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.BSLName = mux.Vars(r)["bsl_name"]
	if req.BSLName == "" {
		return nil, utilerrors.NewBadRequest("'bsl_name' parameter is required but was not provided")
	}
	return req, nil
}

func GetBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (*apiv2.BackupStorageLocation, error) {
	req := request.(getBSLReq)
	if err := common.ValidateUserCanModifyProject(ctx, userInfoGetter, req.ProjectID); err != nil {
		return nil, err
	}

	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	bsl := &velerov1.BackupStorageLocation{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.BSLName, Namespace: clusterbackup.UserClusterBackupNamespace}, bsl); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	res := &apiv2.BackupStorageLocation{
		Name:     bsl.Name,
		CBSLName: bsl.Labels[CBSL],
		Spec:     bsl.Spec,
		Status:   bsl.Status,
	}
	return res, nil
}

// listBSLReq defines HTTP request to list all the BSL present in the cluster
// swagger:parameters listBackupStorageLocation
type listBSLReq struct {
	cluster.GetClusterReq
}

func DecodeListBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listBSLReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)
	return req, nil
}

func ListBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (*apiv2.BackupStorageLocationList, error) {
	req := request.(listBSLReq)
	if err := common.ValidateUserCanModifyProject(ctx, userInfoGetter, req.ProjectID); err != nil {
		return nil, err
	}

	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	bslList := &velerov1.BackupStorageLocationList{}
	if err := client.List(ctx, bslList, ctrlruntimeclient.InNamespace(clusterbackup.UserClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	res := []apiv2.BackupStorageLocationOverview{}
	for _, bsl := range bslList.Items {
		res = append(res, apiv2.BackupStorageLocationOverview{
			Name:         bsl.Name,
			CreationDate: bsl.CreationTimestamp.Time,
			CBSLName:     bsl.Labels[CBSL],
			Region:       bsl.Spec.Config[bslRegion],
			Prefix:       bsl.Spec.ObjectStorage.Prefix,
			Status:       bsl.Status,
		})
	}
	return &apiv2.BackupStorageLocationList{Items: res}, nil
}

// deleteBSLReq defines HTTP request for to delete the backup storage location from the cluster specified by the name
// swagger:parameters deleteBackupStorageLocation
type deleteBSLReq struct {
	cluster.GetClusterReq

	// in: path
	// required: true
	BSLName string `json:"bsl_name"`
}

func DecodeDeleteBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteBSLReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.BSLName = mux.Vars(r)["bsl_name"]
	if req.BSLName == "" {
		return nil, fmt.Errorf("'bsl_name' parameter is required but was not provided")
	}
	return req, nil
}

func DeleteBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	req := request.(deleteBSLReq)
	if err := common.ValidateUserCanModifyProject(ctx, userInfoGetter, req.ProjectID); err != nil {
		return nil, err
	}

	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	if req.BSLName == clusterbackupresources.DefaultBSLName {
		return nil, fmt.Errorf("cannot delete a default BSL from the cluster")
	}

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	bsl := &velerov1.BackupStorageLocation{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.BSLName, Namespace: clusterbackup.UserClusterBackupNamespace}, bsl); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}
	if err := client.Delete(ctx, bsl); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return nil, nil
}

func getBSLLabels(cbslName, projectID, clusterID string) map[string]string {
	return map[string]string{
		kubermaticv1.ProjectIDLabelKey: projectID,
		clusterIdLabelKey:              clusterID,
		CBSL:                           cbslName,
	}
}

func getVeleroCloudCredentials(awsAccessKeyId, awsSecretAccessKey []byte) ([]byte, error) {
	t, err := template.New(resources.ClusterCloudCredentialsSecretName).Parse(credentialsTemplate)
	if err != nil {
		return nil, fmt.Errorf("failed to parse credentials file template: %w", err)
	}
	var buff bytes.Buffer
	if err := t.Execute(&buff, map[string]interface{}{
		accessKeyTemplate:       string(awsAccessKeyId),
		secretAccessKeyTemplate: string(awsSecretAccessKey),
	}); err != nil {
		return nil, fmt.Errorf("failed to execute credentials file template: %w", err)
	}

	return buff.Bytes(), nil
}
