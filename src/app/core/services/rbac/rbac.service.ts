import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {environment} from '../../../../environments/environment';
import {
  Binding,
  ClusterBinding,
  ClusterRole,
  ClusterRoleName,
  CreateBinding,
  KIND_GROUP,
  KIND_USER,
  Namespace,
  Role,
  RoleName,
} from '../../../shared/entity/RBACEntity';

@Injectable()
export class RBACService {
  private _restRoot: string = environment.restRoot;

  constructor(private readonly _http: HttpClient) {}

  getClusterRoleNames(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<ClusterRoleName[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterrolenames`;
    return this._http.get<ClusterRoleName[]>(url);
  }

  getClusterRoles(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<ClusterRole[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles`;
    return this._http.get<ClusterRole[]>(url);
  }

  createClusterRole(
    clusterID: string,
    dc: string,
    projectID: string,
    createClusterRole: ClusterRole
  ): Observable<ClusterRole> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles`;
    return this._http.post<ClusterRole>(url, createClusterRole);
  }

  deleteClusterRole(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${roleID}`;
    return this._http.delete(url);
  }

  patchClusterRole(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string
  ): Observable<ClusterRole> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${roleID}`;
    return this._http.patch<ClusterRole>(url, {});
  }

  getClusterBindings(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<ClusterBinding[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterbindings`;
    return this._http.get<ClusterBinding[]>(url);
  }

  createClusterBinding(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string,
    createClusterRole: CreateBinding
  ): Observable<ClusterBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.post<ClusterBinding>(url, createClusterRole);
  }

  deleteClusterBinding(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string,
    kind: string,
    name: string
  ): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
      body: this._getDeleteBindingBody(kind, name),
    };
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`;
    return this._http.delete(url, options);
  }

  getNamespaces(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<Namespace[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/namespaces`;
    return this._http.get<Namespace[]>(url);
  }

  getRoleNames(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<RoleName[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/rolenames`;
    return this._http.get<RoleName[]>(url);
  }

  getRoles(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<Role[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles`;
    return this._http.get<Role[]>(url);
  }

  createRoles(
    clusterID: string,
    dc: string,
    projectID: string,
    createRole: Role
  ): Observable<Role> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles`;
    return this._http.post<Role>(url, createRole);
  }

  getRole(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string
  ): Observable<Role> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${roleID}`;
    return this._http.get<Role>(url);
  }

  deleteRole(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string,
    namespace: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}/${roleID}`;
    return this._http.delete(url);
  }

  patchRole(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string,
    namespace: string
  ): Observable<Role> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}/${roleID}`;
    return this._http.patch<Role>(url, {});
  }

  getBindings(
    clusterID: string,
    dc: string,
    projectID: string
  ): Observable<Binding[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/bindings`;
    return this._http.get<Binding[]>(url);
  }

  createBinding(
    clusterID: string,
    dc: string,
    projectID: string,
    roleID: string,
    namespace: string,
    createRole: CreateBinding
  ): Observable<Binding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
    return this._http.post<Binding>(url, createRole);
  }

  deleteBinding(
    clusterID: string,
    dc: string,
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
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`;
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
