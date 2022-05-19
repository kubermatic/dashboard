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

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {environment} from '@environments/environment';
import {
  Binding,
  ClusterBinding,
  ClusterRoleName,
  CreateBinding,
  KIND_GROUP,
  KIND_USER,
  RoleName,
} from '@shared/entity/rbac';

@Injectable()
export class RBACService {
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  getClusterRoleNames(clusterID: string, projectID: string): Observable<ClusterRoleName[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterrolenames`;
    return this._http.get<ClusterRoleName[]>(url);
  }

  getClusterBindings(clusterID: string, projectID: string): Observable<ClusterBinding[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbindings`;
    return this._http.get<ClusterBinding[]>(url);
  }

  createClusterBinding(
    clusterID: string,
    projectID: string,
    roleID: string,
    createClusterRole: CreateBinding
  ): Observable<ClusterBinding> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.post<ClusterBinding>(url, createClusterRole);
  }

  deleteClusterBinding(
    clusterID: string,
    projectID: string,
    roleID: string,
    kind: string,
    name: string
  ): Observable<ClusterBinding> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name),
    };
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.delete<ClusterBinding>(url, options);
  }

  getRoleNames(clusterID: string, projectID: string): Observable<RoleName[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/rolenames`;
    return this._http.get<RoleName[]>(url);
  }

  getBindings(clusterID: string, projectID: string): Observable<Binding[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/bindings`;
    return this._http.get<Binding[]>(url);
  }

  createBinding(
    clusterID: string,
    projectID: string,
    roleID: string,
    namespace: string,
    createRole: CreateBinding
  ): Observable<Binding> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.post<Binding>(url, createRole);
  }

  deleteBinding(
    clusterID: string,
    projectID: string,
    roleID: string,
    namespace: string,
    kind: string,
    name: string
  ): Observable<Binding> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name),
    };
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.delete<Binding>(url, options);
  }

  private _getDeleteBindingBody(kind: string, name: string): any {
    const body: any = {};
    if (kind === KIND_GROUP) {
      body.group = name;
    } else if (kind === KIND_USER) {
      body.userEmail = name;
    }
    return body;
  }
}
