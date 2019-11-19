import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {environment} from '../../../../environments/environment';
import {ClusterRole, ClusterRoleClusterBinding, ClusterRoleClusterBindingPatch, ClusterRoleName, ClusterRolePatch, CreateClusterRoleClusterBinding, CreateRoleBinding, Namespace, Role, RoleBinding, RoleBindingPatch, RoleName, RolePatch} from '../../../shared/entity/RBACEntity';

@Injectable()
export class RBACService {
  private _restRoot: string = environment.restRoot;

  constructor(private readonly _http: HttpClient) {}

  getClusterRoleNames(clusterID: string, dc: string, projectID: string): Observable<ClusterRoleName[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterrolenames`;
    return this._http.get<ClusterRoleName[]>(url);
  }

  getClusterRoles(clusterID: string, dc: string, projectID: string): Observable<ClusterRole[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles`;
    return this._http.get<ClusterRole[]>(url);
  }

  createClusterRole(clusterID: string, dc: string, projectID: string, createClusterRole: ClusterRole):
      Observable<ClusterRole> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles`;
    return this._http.post<ClusterRole>(url, createClusterRole);
  }

  deleteClusterRole(clusterID: string, dc: string, projectID: string, roleID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${roleID}`;
    return this._http.delete(url);
  }

  patchClusterRole(clusterID: string, dc: string, projectID: string, roleID: string, patch: ClusterRolePatch):
      Observable<ClusterRole> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${roleID}`;
    return this._http.patch<ClusterRole>(url, patch);
  }

  getClusterRoleClusterBindings(clusterID: string, dc: string, projectID: string, roleID: string):
      Observable<ClusterRoleClusterBinding[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles​/${
        roleID}​/clusterbindings`;
    return this._http.get<ClusterRoleClusterBinding[]>(url);
  }

  createClusterRoleClusterBinding(
      clusterID: string, dc: string, projectID: string, roleID: string,
      createClusterRole: CreateClusterRoleClusterBinding): Observable<ClusterRoleClusterBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles​/${
        roleID}​/clusterbindings`;
    return this._http.post<ClusterRoleClusterBinding>(url, createClusterRole);
  }

  getClusterRoleClusterBinding(clusterID: string, dc: string, projectID: string, roleID: string, bindingID: string):
      Observable<ClusterRoleClusterBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${
        roleID}​/clusterbindings​/${bindingID}`;
    return this._http.get<ClusterRoleClusterBinding>(url);
  }

  deleteClusterRoleClusterBinding(clusterID: string, dc: string, projectID: string, roleID: string, bindingID: string):
      Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${
        roleID}​/clusterbindings​/${bindingID}`;
    return this._http.delete(url);
  }

  patchClusterRoleClusterBinding(
      clusterID: string, dc: string, projectID: string, roleID: string, bindingID: string,
      patch: ClusterRoleClusterBindingPatch): Observable<ClusterRoleClusterBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/clusterroles/${
        roleID}​/clusterbindings​/${bindingID}`;
    return this._http.patch<ClusterRoleClusterBinding>(url, patch);
  }

  getNamespaces(clusterID: string, dc: string, projectID: string): Observable<Namespace[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/namespaces`;
    return this._http.get<Namespace[]>(url);
  }

  getRoleNames(clusterID: string, dc: string, projectID: string): Observable<RoleName[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/rolenames`;
    return this._http.get<RoleName[]>(url);
  }

  getRoles(clusterID: string, dc: string, projectID: string): Observable<Role[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles`;
    return this._http.get<Role[]>(url);
  }

  createRoles(clusterID: string, dc: string, projectID: string, createRole: Role): Observable<Role> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles`;
    return this._http.post<Role>(url, createRole);
  }

  getRole(clusterID: string, dc: string, projectID: string, namespace: string, roleID: string): Observable<Role> {
    const url =
        `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${roleID}`;
    return this._http.get<Role>(url);
  }

  deleteRole(clusterID: string, dc: string, projectID: string, roleID: string, namespace: string): Observable<any> {
    const url =
        `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${roleID}`;
    return this._http.delete(url);
  }

  patchRole(clusterID: string, dc: string, projectID: string, roleID: string, namespace: string, patch: RolePatch):
      Observable<Role> {
    const url =
        `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${roleID}`;
    return this._http.patch<Role>(url, patch);
  }

  getRoleBindings(clusterID: string, dc: string, projectID: string, roleID: string, namespace: string):
      Observable<RoleBinding[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${
        roleID}/bindings`;
    return this._http.get<RoleBinding[]>(url);
  }

  createRoleBindings(
      clusterID: string, dc: string, projectID: string, roleID: string, namespace: string,
      createRole: CreateRoleBinding): Observable<RoleBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${
        roleID}/bindings`;
    return this._http.post<RoleBinding>(url, createRole);
  }

  getRoleBinding(
      clusterID: string, dc: string, projectID: string, roleID: string, namespace: string,
      bindingID: string): Observable<RoleBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${
        roleID}/bindings/${bindingID}`;
    return this._http.get<RoleBinding>(url);
  }

  patchRoleBinding(
      clusterID: string, dc: string, projectID: string, roleID: string, namespace: string, bindingID: string,
      patch: RoleBindingPatch): Observable<RoleBinding> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${
        roleID}/bindings/${bindingID}`;
    return this._http.patch<RoleBinding>(url, patch);
  }

  deleteRoleBinding(
      clusterID: string, dc: string, projectID: string, roleID: string, namespace: string,
      bindingID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/roles/${namespace}​/${
        roleID}/bindings/${bindingID}`;
    return this._http.delete(url);
  }
}
