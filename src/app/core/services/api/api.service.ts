import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {environment} from '../../../../environments/environment';
import {LabelFormComponent} from '../../../shared/components/label-form/label-form.component';
import {TaintFormComponent} from '../../../shared/components/taint-form/taint-form.component';
import {ClusterEntity, MasterVersion, Token} from '../../../shared/entity/ClusterEntity';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {CreateMemberEntity, MemberEntity} from '../../../shared/entity/MemberEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../../shared/entity/NodeDeploymentPatch';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {EditProjectEntity, ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {AzureSizes} from '../../../shared/entity/provider/azure/AzureSizeEntity';
import {DigitaloceanSizes} from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {OpenstackFlavor} from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';

import {CreateServiceAccountEntity, CreateTokenEntity, ServiceAccountEntity, ServiceAccountTokenEntity, ServiceAccountTokenPatch} from '../../../shared/entity/ServiceAccountEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {CreateProjectModel} from '../../../shared/model/CreateProjectModel';
import {Auth} from '../auth/auth.service';

@Injectable()
export class ApiService {
  private _location: string = window.location.protocol + '//' + window.location.host;
  private _restRoot: string = environment.restRoot;
  private readonly _token: string;

  constructor(private readonly _http: HttpClient, private readonly _auth: Auth) {
    this._token = this._auth.getBearerToken();
  }

  createNodeDeployment(cluster: ClusterEntity, nd: NodeDeploymentEntity, dc: string, projectID: string):
      Observable<NodeDeploymentEntity> {
    nd.spec.template.labels = LabelFormComponent.filterNullifiedKeys(nd.spec.template.labels);
    nd.spec.template.taints = TaintFormComponent.filterNullifiedTaints(nd.spec.template.taints);

    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/nodedeployments`;
    return this._http.post<NodeDeploymentEntity>(url, nd);
  }

  getNodeDeployments(cluster: string, dc: string, projectID: string): Observable<NodeDeploymentEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments`;
    return this._http.get<NodeDeploymentEntity[]>(url);
  }

  getNodeDeployment(ndId: string, cluster: string, dc: string, projectID: string): Observable<NodeDeploymentEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}`;
    return this._http.get<NodeDeploymentEntity>(url);
  }

  getNodeDeploymentNodes(ndId: string, cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes`;
    return this._http.get<NodeEntity[]>(url);
  }

  getNodeDeploymentNodesEvents(ndId: string, cluster: string, dc: string, projectID: string):
      Observable<EventEntity[]> {
    const url =
        `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes/events`;
    return this._http.get<EventEntity[]>(url);
  }

  patchNodeDeployment(
      nd: NodeDeploymentEntity, patch: NodeDeploymentPatch, clusterId: string, dc: string,
      projectID: string): Observable<NodeDeploymentEntity> {
    patch.spec.template.labels = LabelFormComponent.filterNullifiedKeys(patch.spec.template.labels);
    patch.spec.template.taints = TaintFormComponent.filterNullifiedTaints(patch.spec.template.taints);

    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterId}/nodedeployments/${nd.id}`;
    return this._http.patch<NodeDeploymentEntity>(url, patch);
  }

  deleteNodeDeployment(cluster: string, nd: NodeDeploymentEntity, dc: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${nd.id}`;
    return this._http.delete(url);
  }

  getProjects(): Observable<ProjectEntity[]> {
    const url = `${this._restRoot}/projects`;
    return this._http.get<ProjectEntity[]>(url);
  }

  createProject(createProjectModel: CreateProjectModel): Observable<ProjectEntity> {
    const url = `${this._restRoot}/projects`;
    return this._http.post<ProjectEntity>(url, createProjectModel);
  }

  editProject(projectID: string, editProjectEntity: EditProjectEntity): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}`;
    return this._http.put(url, editProjectEntity);
  }

  getSSHKeys(projectID: string): Observable<SSHKeyEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys`;
    return this._http.get<SSHKeyEntity[]>(url);
  }

  deleteSSHKey(sshkeyID: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys/${sshkeyID}`;
    return this._http.delete(url);
  }

  addSSHKey(sshKey: SSHKeyEntity, projectID: string): Observable<SSHKeyEntity> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys`;
    return this._http.post<SSHKeyEntity>(url, sshKey);
  }

  getDigitaloceanSizes(projectId: string, dc: string, clusterId: string): Observable<DigitaloceanSizes> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/digitalocean/sizes`;
    return this._http.get<DigitaloceanSizes>(url);
  }

  editToken(cluster: ClusterEntity, dc: string, projectID: string, token: Token): Observable<Token> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/token`;
    return this._http.put<Token>(url, token);
  }

  getOpenStackFlavors(projectId: string, dc: string, cluster: string): Observable<OpenstackFlavor[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/openstack/sizes`;
    return this._http.get<OpenstackFlavor[]>(url);
  }

  getKubeconfigURL(projectID: string, dc: string, clusterID: string): string {
    return `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/kubeconfig?token=${this._token}`;
  }

  getShareKubeconfigURL(projectID: string, dc: string, clusterID: string, userID: string): string {
    return `${this._location}/${this._restRoot}/kubeconfig?project_id=${projectID}&datacenter=${dc}&cluster_id=${
        clusterID}&user_id=${userID}`;
  }

  getMasterVersions(type: 'kubernetes'|'openshift'): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/upgrades/cluster?type=${type}`;
    return this._http.get<MasterVersion[]>(url);
  }

  getAzureSizes(projectId: string, dc: string, cluster: string): Observable<AzureSizes[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/azure/sizes`;
    return this._http.get<AzureSizes[]>(url);
  }

  getMembers(projectID: string): Observable<MemberEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._http.get<MemberEntity[]>(url);
  }

  createMembers(projectID: string, member: CreateMemberEntity): Observable<MemberEntity> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._http.post<MemberEntity>(url, member);
  }

  editMembers(projectID: string, member: MemberEntity): Observable<MemberEntity> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._http.put<MemberEntity>(url, member);
  }

  deleteMembers(projectID: string, member: MemberEntity): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._http.delete(url);
  }

  getServiceAccounts(projectID: string): Observable<ServiceAccountEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts`;
    return this._http.get<ServiceAccountEntity[]>(url);
  }

  createServiceAccount(projectID: string, serviceaccount: CreateServiceAccountEntity):
      Observable<ServiceAccountEntity> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts`;
    return this._http.post<ServiceAccountEntity>(url, serviceaccount);
  }

  editServiceAccount(projectID: string, serviceaccount: ServiceAccountEntity): Observable<ServiceAccountEntity> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}`;
    return this._http.put<ServiceAccountEntity>(url, serviceaccount);
  }

  deleteServiceAccount(projectID: string, serviceaccount: ServiceAccountEntity): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}`;
    return this._http.delete(url);
  }

  getServiceAccountTokens(projectID: string, serviceaccount: ServiceAccountEntity):
      Observable<ServiceAccountTokenEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens`;
    return this._http.get<ServiceAccountTokenEntity[]>(url);
  }

  createServiceAccountToken(projectID: string, serviceaccount: ServiceAccountEntity, token: CreateTokenEntity):
      Observable<ServiceAccountTokenEntity> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens`;
    return this._http.post<ServiceAccountTokenEntity>(url, token);
  }

  regenerateServiceAccountToken(
      projectID: string, serviceaccount: ServiceAccountEntity,
      token: ServiceAccountTokenEntity): Observable<ServiceAccountTokenEntity> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens/${token.id}`;
    return this._http.put<ServiceAccountTokenEntity>(url, token);
  }

  patchServiceAccountToken(
      projectID: string, serviceaccount: ServiceAccountEntity, token: ServiceAccountTokenEntity,
      patchToken: ServiceAccountTokenPatch): Observable<ServiceAccountTokenEntity> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens/${token.id}`;
    return this._http.patch<ServiceAccountTokenEntity>(url, patchToken);
  }

  deleteServiceAccountToken(projectID: string, serviceaccount: ServiceAccountEntity, token: ServiceAccountTokenEntity):
      Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens/${token.id}`;
    return this._http.delete(url);
  }
}
