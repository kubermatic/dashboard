import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {environment} from '../../../../environments/environment';
import {
  Binding,
  ClusterBinding,
  ClusterRoleName,
  CreateBinding,
  KIND_GROUP,
  KIND_USER,
  RoleName,
} from '../../../shared/entity/rbac';

@Injectable()
export class RBACService {
  private _restRoot: string = environment.restRoot;

  constructor(private readonly _http: HttpClient) {}

  getClusterRoleNames(clusterID: string, seed: string, projectID: string): Observable<ClusterRoleName[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/clusterrolenames`;
    return this._http.get<ClusterRoleName[]>(url);
  }

  getClusterBindings(clusterID: string, seed: string, projectID: string): Observable<ClusterBinding[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/clusterbindings`;
    return this._http.get<ClusterBinding[]>(url);
  }

  createClusterBinding(
    clusterID: string,
    seed: string,
    projectID: string,
    roleID: string,
    createClusterRole: CreateBinding
  ): Observable<ClusterBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.post<ClusterBinding>(url, createClusterRole);
  }

  deleteClusterBinding(
    clusterID: string,
    seed: string,
    projectID: string,
    roleID: string,
    kind: string,
    name: string
  ): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name),
    };
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.delete(url, options);
  }

  getRoleNames(clusterID: string, seed: string, projectID: string): Observable<RoleName[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/rolenames`;
    return this._http.get<RoleName[]>(url);
  }

  getBindings(clusterID: string, seed: string, projectID: string): Observable<Binding[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/bindings`;
    return this._http.get<Binding[]>(url);
  }

  createBinding(
    clusterID: string,
    seed: string,
    projectID: string,
    roleID: string,
    namespace: string,
    createRole: CreateBinding
  ): Observable<Binding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.post<Binding>(url, createRole);
  }

  deleteBinding(
    clusterID: string,
    seed: string,
    projectID: string,
    roleID: string,
    namespace: string,
    kind: string,
    name: string
  ): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name),
    };
    const url = `${this._restRoot}/projects/${projectID}/dc/${seed}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.delete(url, options);
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
