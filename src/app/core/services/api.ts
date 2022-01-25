// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Cluster, CNIPlugin, CNIPluginVersions, MasterVersion, Token} from '@shared/entity/cluster';
import {Observable} from 'rxjs';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

@Injectable()
export class ApiService {
  private _location: string = window.location.protocol + '//' + window.location.host;
  private _restRoot: string = environment.restRoot;
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  editToken(cluster: Cluster, projectID: string, token: Token): Observable<Token> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster.id}/token`;
    return this._http.put<Token>(url, token);
  }

  editViewerToken(cluster: Cluster, projectID: string, token: Token): Observable<Token> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster.id}/viewertoken`;
    return this._http.put<Token>(url, token);
  }

  getKubeconfigURL(projectID: string, clusterID: string): string {
    return `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/kubeconfig`;
  }

  getDashboardProxyURL(projectID: string, clusterID: string): string {
    return `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/dashboard/proxy`;
  }

  getShareKubeconfigURL(projectID: string, seed: string, clusterID: string, userID: string): string {
    return `${this._location}/${this._restRoot}/kubeconfig?project_id=${projectID}&datacenter=${seed}&cluster_id=${clusterID}&user_id=${userID}`;
  }

  getMasterVersions(provider: NodeProvider): Observable<MasterVersion[]> {
    const url = `${this._newRestRoot}/providers/${provider}/versions`;
    return this._http.get<MasterVersion[]>(url);
  }

  getAdmissionPlugins(version: string): Observable<string[]> {
    const url = `${this._restRoot}/admission/plugins/${version}`;
    return this._http.get<string[]>(url);
  }

  getCNIPluginVersions(cniPlugin: CNIPlugin): Observable<CNIPluginVersions> {
    const url = `${this._newRestRoot}/cni/${cniPlugin}/versions`;
    return this._http.get<CNIPluginVersions>(url);
  }

  getSwaggerJson(): Observable<any> {
    const url = '/api/swagger.json';
    return this._http.get(url);
  }
}
