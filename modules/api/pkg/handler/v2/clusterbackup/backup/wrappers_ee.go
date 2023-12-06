//go:build ee

/*
		Kubermatic Enterprise Read-Only License
		       Version 1.0 ("KERO-1.0”)
		   Copyright © 2023 Kubermatic GmbH

	 1. You may only view, read and display for studying purposes the source
	    code of the software licensed under this license, and, to the extent
	    explicitly provided under this license, the binary code.
	 2. Any use of the software which exceeds the foregoing right, including,
	    without limitation, its execution, compilation, copying, modification
	    and distribution, is expressly prohibited.
	 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
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
	"net/http"

	clusterbackup "k8c.io/dashboard/v2/pkg/ee/clusterbackup/backup"
	"k8c.io/dashboard/v2/pkg/provider"
)

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeListClusterBackupReq(c, r)
}

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeCreateClusterBackupReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeGetClusterBackupReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterbackup.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeDeleteClusterBackupReq(c, r)
}

func projectListEndpoint(ctx context.Context, request interface{}) (interface{}, error) {
	return clusterbackup.ProjectListEndpoint(ctx, request)
}

func decodeListProjectClustersBackupConfigReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterbackup.DecodeListProjectClustersBackupConfigReq(c, r)
}
