import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {LabelFormComponent} from '../../../shared/components/label-form/label-form.component';
import {TaintFormComponent} from '../../../shared/components/taint-form/taint-form.component';
import {ClusterEntity, Finalizer, MasterVersion, Token} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {HealthEntity} from '../../../shared/entity/HealthEntity';
import {CreateMemberEntity, MemberEntity} from '../../../shared/entity/MemberEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../../shared/entity/NodeDeploymentPatch';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {EditProjectEntity, ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {AzureSizes} from '../../../shared/entity/provider/azure/AzureSizeEntity';
import {DigitaloceanSizes} from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {OpenstackFlavor, OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant,} from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {VSphereNetwork} from '../../../shared/entity/provider/vsphere/VSphereEntity';

import {CreateServiceAccountEntity, CreateTokenEntity, ServiceAccountEntity, ServiceAccountTokenEntity, ServiceAccountTokenPatch} from '../../../shared/entity/ServiceAccountEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {CreateClusterModel} from '../../../shared/model/CreateClusterModel';
import {CreateProjectModel} from '../../../shared/model/CreateProjectModel';
import {Auth} from '../auth/auth.service';

@Injectable()
export class ApiService {
  private _location: string = window.location.protocol + '//' + window.location.host;
  private _restRoot: string = environment.restRoot;
  private _headers: HttpHeaders = new HttpHeaders();
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

  deleteProject(projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}`;
    return this._http.delete(url);
  }

  getAllClusters(projectID: string): Observable<ClusterEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters`;
    return this._http.get<ClusterEntity[]>(url);
  }
  getCluster(cluster: string, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}`;
    return this._http.get<ClusterEntity>(url);
  }

  createCluster(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    createClusterModel.nodeDeployment.spec.template.labels =
        LabelFormComponent.filterNullifiedKeys(createClusterModel.nodeDeployment.spec.template.labels);
    createClusterModel.nodeDeployment.spec.template.taints =
        TaintFormComponent.filterNullifiedTaints(createClusterModel.nodeDeployment.spec.template.taints);

    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters`;
    return this._http.post<ClusterEntity>(url, createClusterModel);
  }

  patchCluster(patch: ClusterEntityPatch, clusterId: string, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterId}`;
    return this._http.patch<ClusterEntity>(url, patch);
  }

  deleteCluster(cluster: string, dc: string, projectID: string, finalizers?: {[key in Finalizer]: boolean}):
      Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}`;
    if (finalizers !== undefined) {
      for (const key of Object.keys(finalizers)) {
        this._headers = this._headers.set(key, finalizers[key].toString());
      }
    }

    return this._http.delete(url, {headers: this._headers});
  }

  getClusterEvents(cluster: string, dc: string, projectID: string): Observable<EventEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/events`;
    return this._http.get<EventEntity[]>(url);
  }

  getClusterHealth(cluster: string, dc: string, projectID: string): Observable<HealthEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/health`;
    return this._http.get<HealthEntity>(url);
  }

  upgradeClusterNodeDeployments(version: string, cluster: string, dc: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes/upgrades`;
    return this._http.put(url, {version} as MasterVersion);
  }

  getClusterNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes?hideInitialConditions=true`;
    return this._http.get<NodeEntity[]>(url);
  }

  createClusterNode(cluster: ClusterEntity, node: NodeEntity, dc: string, projectID: string): Observable<NodeEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/nodes`;
    return this._http.post<NodeEntity>(url, node);
  }

  deleteClusterNode(cluster: string, node: NodeEntity, dc: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes/${node.id}`;
    return this._http.delete(url);
  }

  getClusterSSHKeys(cluster: string, dc: string, projectID: string): Observable<SSHKeyEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/sshkeys`;
    return this._http.get<SSHKeyEntity[]>(url);
  }

  deleteClusterSSHKey(sshkeyID: string, cluster: string, dc: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/sshkeys/${sshkeyID}`;
    return this._http.delete(url);
  }

  addClusterSSHKey(sshkeyID: string, cluster: string, dc: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/sshkeys/${sshkeyID}`;
    return this._http.put(url, null);
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

  getDigitaloceanSizesForWizard(token: string): Observable<DigitaloceanSizes> {
    this._headers = this._headers.set('DoToken', token);
    const url = `${this._restRoot}/providers/digitalocean/sizes`;
    return this._http.get<DigitaloceanSizes>(url, {headers: this._headers});
  }

  getDigitaloceanSizes(projectId: string, dc: string, clusterId: string): Observable<DigitaloceanSizes> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/digitalocean/sizes`;
    return this._http.get<DigitaloceanSizes>(url);
  }

  getClusterUpgrades(projectID: string, dc: string, clusterID: string): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/upgrades`;
    return this._http.get<MasterVersion[]>(url).pipe(catchError(() => {
      return of<MasterVersion[]>([]);
    }));
  }

  getClusterNodeUpgrades(controlPlaneVersion: string, type: string): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/upgrades/node?control_plane_version=${controlPlaneVersion}&type=${type}`;
    return this._http.get<MasterVersion[]>(url).pipe(catchError(() => {
      return of<MasterVersion[]>([]);
    }));
  }

  editToken(cluster: ClusterEntity, dc: string, projectID: string, token: Token): Observable<Token> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/token`;
    return this._http.put<Token>(url, token);
  }

  private setOpenStackHeaders(username: string, password: string, domain: string, datacenterName: string): void {
    this._headers = this._headers.set('Username', username);
    this._headers = this._headers.set('Password', password);
    this._headers = this._headers.set('Domain', domain);
    this._headers = this._headers.set('DatacenterName', datacenterName);
  }

  getOpenStackFlavorsForWizard(
      username: string, password: string, tenant: string, domain: string,
      datacenterName: string): Observable<OpenstackFlavor[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this._headers = this._headers.set('Tenant', tenant);
    const url = `${this._restRoot}/providers/openstack/sizes`;
    return this._http.get<OpenstackFlavor[]>(url, {headers: this._headers});
  }

  getOpenStackFlavors(projectId: string, dc: string, cluster: string): Observable<OpenstackFlavor[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/openstack/sizes`;
    return this._http.get<OpenstackFlavor[]>(url);
  }

  getOpenStackTenantsForWizard(username: string, password: string, domain: string, datacenterName: string):
      Observable<OpenstackTenant[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    const url = `${this._restRoot}/providers/openstack/tenants`;
    return this._http.get<OpenstackTenant[]>(url, {headers: this._headers});
  }

  getOpenStackSecurityGroupsForWizard(
      username: string, password: string, tenant: string, domain: string,
      datacenterName: string): Observable<OpenstackSecurityGroup[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this._headers = this._headers.set('Tenant', tenant);
    const url = `${this._restRoot}/providers/openstack/securitygroups`;
    return this._http.get<OpenstackSecurityGroup[]>(url, {headers: this._headers});
  }

  getOpenStackNetworkForWizard(
      username: string, password: string, tenant: string, domain: string,
      datacenterName: string): Observable<OpenstackNetwork[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this._headers = this._headers.set('Tenant', tenant);
    const url = `${this._restRoot}/providers/openstack/networks`;
    return this._http.get<OpenstackNetwork[]>(url, {headers: this._headers});
  }

  getOpenStackSubnetIdsForWizard(
      username: string, password: string, tenant: string, domain: string, datacenterName: string,
      network: string): Observable<OpenstackSubnet[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this._headers = this._headers.set('Tenant', tenant);
    const url = `${this._restRoot}/providers/openstack/subnets?network_id=${network}`;
    return this._http.get<OpenstackSubnet[]>(url, {headers: this._headers});
  }

  getKubeconfigURL(projectID: string, dc: string, clusterID: string): string {
    return `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/kubeconfig?token=${this._token}`;
  }

  getShareKubeconfigURL(projectID: string, dc: string, clusterID: string, userID: string): string {
    return `${this._location}/${this._restRoot}/kubeconfig?project_id=${projectID}&datacenter=${dc}&cluster_id=${
        clusterID}&user_id=${userID}`;
  }

  // type has to be eather kubernetes or openshift
  getMasterVersions(type: string): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/upgrades/cluster?type=${type}`;
    return this._http.get<MasterVersion[]>(url);
  }

  getAzureSizesForWizard(
      clientID: string, clientSecret: string, subscriptionID: string, tenantID: string,
      location: string): Observable<AzureSizes[]> {
    this._headers = this._headers.set('ClientID', clientID);
    this._headers = this._headers.set('ClientSecret', clientSecret);
    this._headers = this._headers.set('SubscriptionID', subscriptionID);
    this._headers = this._headers.set('TenantID', tenantID);
    this._headers = this._headers.set('Location', location);
    const url = `${this._restRoot}/providers/azure/sizes`;
    return this._http.get<AzureSizes[]>(url, {headers: this._headers});
  }

  getAzureSizes(projectId: string, dc: string, cluster: string): Observable<AzureSizes[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/azure/sizes`;
    return this._http.get<AzureSizes[]>(url);
  }

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    this._headers = this._headers.set('Username', username);
    this._headers = this._headers.set('Password', password);
    this._headers = this._headers.set('DatacenterName', datacenterName);
    const url = `${this._restRoot}/providers/vsphere/networks`;
    return this._http.get<VSphereNetwork[]>(url, {headers: this._headers});
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
