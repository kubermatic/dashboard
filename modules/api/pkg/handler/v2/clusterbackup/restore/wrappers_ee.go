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
package clusterrestore

import (
	"context"
	"net/http"

	clusterrestore "k8c.io/dashboard/v2/pkg/ee/clusterbackup/restore"
	"k8c.io/dashboard/v2/pkg/provider"
)

func createEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.CreateEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeCreateClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeCreateClusterRestoreReq(c, r)
}

func listEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.ListEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeListClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeListClusterRestoreReq(c, r)
}

func getEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.GetEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeGetRestoreBackupReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeGetRestoreBackupReq(c, r)
}

func deleteEndpoint(ctx context.Context, req interface{}, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider) (interface{}, error) {
	return clusterrestore.DeleteEndpoint(ctx, req, userInfoGetter, projectProvider, privilegedProjectProvider)
}

func decodeDeleteClusterRestoreReq(c context.Context, r *http.Request) (interface{}, error) {
	return clusterrestore.DecodeDeleteClusterRestoreReq(c, r)
}
