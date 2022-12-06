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
import {Observable, timer, startWith, Subject, merge} from 'rxjs';

import {environment} from '@environments/environment';
import {
  Binding,
  ClusterBinding,
  ClusterRoleName,
  CreateBinding,
  DeleteBindingBody,
  Kind,
  RoleName,
} from '@shared/entity/rbac';
import {ClusterNamespace} from '@shared/entity/cluster-namespace';
import {map, switchMap, tap, distinctUntilChanged} from 'rxjs/operators';
import {AppConfigService} from 'app/config.service';
import _ from 'lodash';

@Injectable()
export class RBACService {
  private _newRestRoot: string = environment.newRestRoot;
  private readonly _refreshTime = 10;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);

  private _refreshClusterBindings$ = new Subject<void>();
  private _refreshNamespaceBindings$ = new Subject<void>();

  private _clusterNamespacesMap = new Map<string, string[]>();
  private _namespaceRoleNameMap = new Map<string, RoleName[]>();
  private _clusterRoleNamesMap = new Map<string, ClusterRoleName[]>();
  private _clusterBindingMap = new Map<string, ClusterBinding[]>();
  private _namespaceBindingsMap = new Map<string, Binding[]>();

  constructor(private readonly _http: HttpClient, private readonly _appConfig: AppConfigService) {}

  getClusterRoleNames(clusterID: string, projectID: string): Observable<ClusterRoleName[]> {
    const mapKey = projectID + '-' + clusterID;
    const request$ = this._refreshTimer$.pipe(
      switchMap(_ =>
        this._http.get<ClusterRoleName[]>(
          `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterrolenames`
        )
      ),
      distinctUntilChanged((prev, curr) => _.isEqual(prev, curr)),
      tap(roleNames => this._clusterRoleNamesMap.set(mapKey, roleNames))
    );

    return this._clusterRoleNamesMap.has(mapKey)
      ? request$.pipe(startWith(this._clusterRoleNamesMap.get(mapKey)))
      : request$;
  }

  getClusterBindings(clusterID: string, projectID: string): Observable<ClusterBinding[]> {
    const mapKey = clusterID + '-' + projectID;
    const request$ = merge(this._refreshTimer$, this._refreshClusterBindings$).pipe(
      switchMap(_ =>
        this._http.get<ClusterBinding[]>(
          `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbindings`
        )
      ),
      distinctUntilChanged((prev, curr) => _.isEqual(prev, curr)),
      tap(clusterBinding => this._clusterBindingMap.set(mapKey, clusterBinding))
    );

    return this._clusterBindingMap.has(mapKey)
      ? request$.pipe(startWith(this._clusterBindingMap.get(mapKey)))
      : request$;
  }

  refreshClusterBindings() {
    this._refreshClusterBindings$.next();
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

  getNamespaceRoleNames(clusterID: string, projectID: string): Observable<RoleName[]> {
    const mapKey = clusterID + '-' + projectID;
    const request$ = merge(this._refreshTimer$).pipe(
      switchMap(_ =>
        this._http.get<RoleName[]>(`${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/rolenames`)
      ),
      distinctUntilChanged((prev, curr) => _.isEqual(prev, curr)),
      tap(roleNames => {
        this._namespaceRoleNameMap.set(mapKey, roleNames);
      })
    );

    return this._namespaceRoleNameMap.has(mapKey)
      ? request$.pipe(startWith(this._namespaceRoleNameMap.get(mapKey)))
      : request$;
  }

  getNamespaceBindings(clusterID: string, projectID: string): Observable<Binding[]> {
    const mapKey = clusterID + '-' + projectID;
    const request$ = merge(this._refreshTimer$, this._refreshNamespaceBindings$).pipe(
      switchMap(_ =>
        this._http.get<Binding[]>(`${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/bindings`)
      ),
      distinctUntilChanged((prev, curr) => _.isEqual(prev, curr)),
      tap(namespaceBindings => this._namespaceBindingsMap.set(mapKey, namespaceBindings))
    );

    return this._namespaceBindingsMap.has(mapKey)
      ? request$.pipe(startWith(this._namespaceBindingsMap.get(mapKey)))
      : request$;
  }

  refreshNamespaceBindings(): void {
    this._refreshNamespaceBindings$.next();
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
    name: string,
    subjectNamespace: string
  ): Observable<Binding> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name, subjectNamespace),
    };
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.delete<Binding>(url, options);
  }

  getClusterNamespaces(projectID: string, clusterID: string): Observable<string[]> {
    const mapKey = projectID + '-' + clusterID;
    const request$ = this._refreshTimer$.pipe(
      switchMap(_ =>
        this._http.get<ClusterNamespace[]>(
          `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/namespaces`
        )
      ),
      map(namespaces => namespaces.map(namespace => namespace.name)),
      distinctUntilChanged((prev, curr) => _.isEqual(prev, curr)),
      tap(namespaces => this._clusterNamespacesMap.set(mapKey, namespaces))
    );

    return this._clusterNamespacesMap.has(mapKey)
      ? request$.pipe(startWith(this._clusterNamespacesMap.get(mapKey)))
      : request$;
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
