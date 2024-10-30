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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, Subject, timer} from 'rxjs';

import {environment} from '@environments/environment';
import {map, shareReplay, switchMap} from 'rxjs/operators';
import {
  ClusterBinding,
  ClusterNamespace,
  ClusterRoleName,
  CreateBinding,
  DeleteBindingBody,
  Kind,
  NamespaceBinding,
  RoleName,
} from '@shared/entity/rbac';
import {AppConfigService} from '@app/config.service';

@Injectable()
export class RBACService {
  private readonly _refreshTime = 10;
  private _newRestRoot: string = environment.newRestRoot;
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _refreshClusterBindings$ = new Subject<void>();
  private _refreshNamespaceBindings$ = new Subject<void>();
  private _clusterNamespacesMap = new Map<string, Observable<string[]>>();
  private _namespaceRoleNameMap = new Map<string, Observable<RoleName[]>>();
  private _clusterRoleNamesMap = new Map<string, Observable<ClusterRoleName[]>>();
  private _clusterBindingsMap = new Map<string, Observable<ClusterBinding[]>>();
  private _namespaceBindingsMap = new Map<string, Observable<NamespaceBinding[]>>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

  getClusterRoleNames(clusterID: string, projectID: string): Observable<ClusterRoleName[]> {
    const mapKey = projectID + '-' + clusterID;

    if (!this._clusterRoleNamesMap.has(mapKey)) {
      const request$ = this._refreshTimer$.pipe(
        switchMap(_ =>
          this._http.get<ClusterRoleName[]>(
            `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterrolenames`
          )
        ),
        shareReplay({
          refCount: true,
          bufferSize: 1,
        })
      );

      this._clusterRoleNamesMap.set(mapKey, request$);
    }
    return this._clusterRoleNamesMap.get(mapKey);
  }

  getClusterBindings(clusterID: string, projectID: string): Observable<ClusterBinding[]> {
    const mapKey = clusterID + '-' + projectID;

    if (!this._clusterBindingsMap.has(mapKey)) {
      const request$ = merge(this._refreshTimer$, this._refreshClusterBindings$).pipe(
        switchMap(_ =>
          this._http.get<ClusterBinding[]>(
            `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbindings`
          )
        ),
        shareReplay({
          refCount: true,
          bufferSize: 1,
        })
      );

      this._clusterBindingsMap.set(mapKey, request$);
    }

    return this._clusterBindingsMap.get(mapKey);
  }

  getNamespaceRoleNames(clusterID: string, projectID: string): Observable<RoleName[]> {
    const mapKey = clusterID + '-' + projectID;

    if (!this._namespaceRoleNameMap.has(mapKey)) {
      const request$ = merge(this._refreshTimer$).pipe(
        switchMap(_ =>
          this._http.get<RoleName[]>(`${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/rolenames`)
        ),
        shareReplay({
          refCount: true,
          bufferSize: 1,
        })
      );

      this._namespaceRoleNameMap.set(mapKey, request$);
    }
    return this._namespaceRoleNameMap.get(mapKey);
  }

  getNamespaceBindings(clusterID: string, projectID: string): Observable<NamespaceBinding[]> {
    const mapKey = clusterID + '-' + projectID;

    if (!this._namespaceBindingsMap.has(mapKey)) {
      const request$ = merge(this._refreshTimer$, this._refreshNamespaceBindings$).pipe(
        switchMap(_ =>
          this._http.get<NamespaceBinding[]>(
            `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/bindings`
          )
        ),
        shareReplay({
          refCount: true,
          bufferSize: 1,
        })
      );

      this._namespaceBindingsMap.set(mapKey, request$);
    }
    return this._namespaceBindingsMap.get(mapKey);
  }

  getClusterNamespaces(projectID: string, clusterID: string): Observable<string[]> {
    const mapKey = projectID + '-' + clusterID;

    if (!this._clusterNamespacesMap.has(mapKey)) {
      const request$ = this._refreshTimer$.pipe(
        switchMap(_ =>
          this._http.get<ClusterNamespace[]>(
            `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/namespaces`
          )
        ),
        map(namespaces => namespaces.map(namespace => namespace.name)),
        shareReplay({
          refCount: true,
          bufferSize: 1,
        })
      );
      this._clusterNamespacesMap.set(mapKey, request$);
    }
    return this._clusterNamespacesMap.get(mapKey);
  }

  refreshClusterBindings() {
    this._refreshClusterBindings$.next();
  }

  refreshNamespaceBindings(): void {
    this._refreshNamespaceBindings$.next();
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
    name: string,
    namespace: string
  ): Observable<ClusterBinding> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name, namespace),
    };
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.delete<ClusterBinding>(url, options);
  }

  createNamespaceBinding(
    clusterID: string,
    projectID: string,
    roleID: string,
    namespace: string,
    createRole: CreateBinding
  ): Observable<NamespaceBinding> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.post<NamespaceBinding>(url, createRole);
  }

  deleteNamespaceBinding(
    clusterID: string,
    projectID: string,
    roleID: string,
    namespace: string,
    kind: string,
    name: string,
    subjectNamespace: string
  ): Observable<NamespaceBinding> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name, subjectNamespace),
    };
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.delete<NamespaceBinding>(url, options);
  }

  private _getDeleteBindingBody(kind: string, name: string, namespace: string): DeleteBindingBody {
    const body = {} as DeleteBindingBody;
    if (kind === Kind.Group) {
      body.group = name;
    } else if (kind === Kind.User) {
      body.userEmail = name;
    } else if (kind === Kind.ServiceAccount) {
      body.serviceAccount = name;
      body.serviceAccountNamespace = namespace;
    }
    return body;
  }
}
