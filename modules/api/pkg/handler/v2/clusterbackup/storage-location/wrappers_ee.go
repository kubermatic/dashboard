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

package storagelocation

import (
	"context"
	"net/http"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	storagelocation "k8c.io/dashboard/v2/pkg/ee/clusterbackup/storage-location"

	"k8c.io/dashboard/v2/pkg/provider"
)

func listCBSL(ctx context.Context, request interface{}, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) ([]*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.ListCBSL(ctx, request, provider, projectProvider)
}

func getCBSL(ctx context.Context, request interface{}, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.GetCSBL(ctx, request, provider, projectProvider)
}

func createCBSL(ctx context.Context, request interface{}, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.CreateCBSL(ctx, request, provider, projectProvider)
}

func deleteCBSL(ctx context.Context, request interface{}, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.DeleteCBSL(ctx, request, provider, projectProvider)
}

func updateCBSL(ctx context.Context, request interface{}, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) (*apiv2.ClusterBackupStorageLocation, error) {
	return storagelocation.UpdateCBSL(ctx, request, provider, projectProvider)
}

func DecodeListProjectCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeListProjectCBSLReq(ctx, r)
}

func DecodeGetCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeGetCBSLReq(ctx, r)
}

func DecodeCreateCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeCreateCBSLReq(ctx, r)
}

func DecodeDeleteCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeDeleteCBSLReq(ctx, r)
}

func DecodeUpdateCBSLReq(ctx context.Context, r *http.Request) (interface{}, error) {
	return storagelocation.DecodeUpdateCBSLReq(ctx, r)
}
