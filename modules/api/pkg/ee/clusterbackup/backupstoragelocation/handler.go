//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2024 Kubermatic GmbH

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
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apiserver/pkg/storage/names"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	displayNameLabelKey      = "bsl-display-name"
	credentialsSecretKeyName = "cloud-credentials"
	clusterIdLabelKey        = "cluster-id"
	importBSL                = "import-bsl"
)

// createBSLReq defines HTTP request for createBSL
// swagger:parameters createBackupStorageLocation
type createBSLReq struct {
	cluster.GetClusterReq

	// in: body
	// required: true
	Body BslBody
}

type BslBody struct {
	// Name of the cluster backup
	Name string `json:"name,omitempty"`
	// Spec of a Velero cluster backup
	Credentials apiv2.BackupCredentials `json:"credentials,omitempty"`
	// restrict from UI to select same prefix as that of current cluster id
	BSLSpec velerov1.BackupStorageLocationSpec `json:"bslSpec,omitempty"`
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

func CreateBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, backupProvider provider.BackupStorageProvider, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(createBSLReq)
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	bslName := importBSL
	bslSpec := req.Body.BSLSpec.DeepCopy()
	bsl := &velerov1.BackupStorageLocation{
		Spec: *bslSpec,
	}
	bsl.Spec.AccessMode = velerov1.BackupStorageLocationAccessModeReadOnly
	secretRefName := bslSpec.Credential.Name

	bsl, err = createBSL(ctx, client, backupProvider, bslName, req.ProjectID, req.ClusterID, bsl, nil, secretRefName)
	if err != nil {
		return nil, err
	}

	return bsl, nil
}

func createBSL(ctx context.Context, client ctrlruntimeclient.Client, backupProvider provider.BackupStorageProvider, bslName, projectID, clusterID string, bsl *velerov1.BackupStorageLocation, credentials *apiv2.BackupCredentials, secretRefName string) (*velerov1.BackupStorageLocation, error) {
	hash := string(sha256.New().Sum([]byte(bsl.Spec.ObjectStorage.Bucket + bsl.Spec.ObjectStorage.Prefix)))
	bslFullName := fmt.Sprintf("%s-%s-%s", bslName, clusterID, hash)
	existingSecret := true
	secret := &corev1.Secret{}
	if err := client.Get(ctx, types.NamespacedName{Name: secretRefName, Namespace: clusterbackup.UserClusterBackupNamespace}, secret); err != nil {
		log.Logger.Errorf("secret doesn't exist for ref: %s in the cluster, creating new secret", secretRefName)
	}

	if secret.Name == "" {
		existingSecret = false
		dataBytes, err := backupProvider.GetStorageLocationCreds(ctx, secretRefName)
		if err != nil {
			return nil, fmt.Errorf("please provide correct creds, error: %v", err.Error())
		}

		accessKeyId, err := decodeSecret(dataBytes["accessKeyId"])
		if err != nil {
			return nil, fmt.Errorf("error while getting creds, error: %v", err.Error())
		}
		secretAccessKey, err := decodeSecret(dataBytes["secretAccessKey"])
		if err != nil {
			return nil, fmt.Errorf("error while getting creds, error: %v", err.Error())
		}
		secret = &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      names.SimpleNameGenerator.GenerateName(secretRefName),
				Namespace: clusterbackup.UserClusterBackupNamespace,
				Labels:    getBSLLabels(bslFullName, projectID, clusterID),
			},
			Data: map[string][]byte{
				"accessKeyId":     accessKeyId,
				"secretAccessKey": secretAccessKey,
			},
		}
	}

	bsl.ObjectMeta = metav1.ObjectMeta{
		Name:      bslFullName,
		Namespace: clusterbackup.UserClusterBackupNamespace,
		Labels:    getBSLLabels(bslName, projectID, clusterID),
	}

	if !existingSecret {
		bsl.Spec.Credential = &corev1.SecretKeySelector{
			LocalObjectReference: corev1.LocalObjectReference{
				Name: secret.Name,
			},
			Key: credentialsSecretKeyName,
		}
	}

	if err := client.Create(ctx, bsl); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	if !existingSecret {
		ownerReferences := []metav1.OwnerReference{
			{
				APIVersion: bsl.APIVersion,
				Kind:       bsl.Kind,
				Name:       bslFullName,
				UID:        bsl.UID,
			},
		}
		secret.ObjectMeta.OwnerReferences = ownerReferences

		if err := client.Create(ctx, secret); err != nil {
			return nil, err
		}
	}
	return bsl, nil
}

func decodeSecret(data []byte) ([]byte, error) {
	decodedData, err := base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return nil, err
	}
	return decodedData, nil
}

// getBSLReq defines HTTP request for getbsl
// swagger:parameters getBackupStorageLocation
type getBSLReq struct {
	cluster.GetClusterReq
	//in: path
	// required: true
	BslName string `json:"bsl_name"`
}

func DecodeGetBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getBSLReq

	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}

	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.BslName = mux.Vars(r)["bsl_name"]
	if req.BslName == "" {
		return nil, fmt.Errorf("'bsl_name' parameter is required but was not provided")
	}
	return req, nil
}

func GetBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(getBSLReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}

	bsl := &velerov1.BackupStorageLocation{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.BslName, Namespace: clusterbackup.UserClusterBackupNamespace}, bsl); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	return bsl, nil
}

// listBSLReq defines HTTP request for list BSL
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

func ListBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(listBSLReq)
	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	bslList := &velerov1.BackupStorageLocationList{}

	if err := client.List(ctx, bslList, ctrlruntimeclient.InNamespace(clusterbackup.UserClusterBackupNamespace)); err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	return bslList, nil
}

// deleteBSLReq defines HTTP request for deletebsl
// swagger:parameters deleteBackupStorageLocation
type deleteBSLReq struct {
	cluster.GetClusterReq
	// in: body
	BslName string `json:"bsl_name"`
}

func DecodeDeleteBSLReq(c context.Context, r *http.Request) (interface{}, error) {
	var req deleteBSLReq
	cr, err := cluster.DecodeGetClusterReq(c, r)
	if err != nil {
		return nil, err
	}
	req.GetClusterReq = cr.(cluster.GetClusterReq)

	req.BslName = mux.Vars(r)["bsl_name"]
	if req.BslName == "" {
		return nil, fmt.Errorf("'bsl_name' parameter is required but was not provided")
	}
	return req, nil
}

func DeleteBSLEndpoint(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider) (interface{}, error) {
	if err := clusterbackup.IsClusterBackupEnabled(ctx, settingsProvider); err != nil {
		return nil, err
	}

	req := request.(deleteBSLReq)

	client, err := handlercommon.GetClusterClientWithClusterID(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, req.ClusterID)
	if err != nil {
		return nil, err
	}
	bsl := &velerov1.BackupStorageLocation{}
	if err := client.Get(ctx, types.NamespacedName{Name: req.BslName, Namespace: clusterbackup.UserClusterBackupNamespace}, bsl); err != nil {
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

func getBSLLabels(displayName, projectID, clusterID string) map[string]string {
	return map[string]string{
		kubermaticv1.ProjectIDLabelKey: projectID,
		clusterIdLabelKey:              clusterID,
		displayNameLabelKey:            displayName,
	}
}
