import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {ClusterEntity, Finalizer, MasterVersion, Token} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {CreateMemberEntity, MemberEntity} from '../../../shared/entity/MemberEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../../shared/entity/NodeDeploymentPatch';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {EditProjectEntity, ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {AzureSizes} from '../../../shared/entity/provider/azure/AzureSizeEntity';
import {DigitaloceanSizes} from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {OpenstackFlavor, OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant,} from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {VSphereNetwork} from '../../../shared/entity/provider/vsphere/VSphereEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {CreateClusterModel} from '../../../shared/model/CreateClusterModel';
import {CreateProjectModel} from '../../../shared/model/CreateProjectModel';
import {Auth} from '../auth/auth.service';

@Injectable()
export class ApiService {
  private location: string = window.location.protocol + '//' + window.location.host;
  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();
  private readonly token: string;

  constructor(private http: HttpClient, private auth: Auth) {
    this.token = this.auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + this.token);
  }

  createNodeDeployment(cluster: ClusterEntity, nd: NodeDeploymentEntity, dc: string, projectID: string):
      Observable<NodeDeploymentEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/nodedeployments`;
    return this.http.post<NodeDeploymentEntity>(url, nd, {headers: this.headers});
  }

  getNodeDeployments(cluster: string, dc: string, projectID: string): Observable<NodeDeploymentEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments`;
    return this.http.get<NodeDeploymentEntity[]>(url, {headers: this.headers});
  }

  getNodeDeployment(ndId: string, cluster: string, dc: string, projectID: string): Observable<NodeDeploymentEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}`;
    return this.http.get<NodeDeploymentEntity>(url, {headers: this.headers});
  }

  getNodeDeploymentNodes(ndId: string, cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes`;
    return this.http.get<NodeEntity[]>(url, {headers: this.headers});
  }

  getNodeDeploymentNodesEvents(ndId: string, cluster: string, dc: string, projectID: string):
      Observable<EventEntity[]> {
    const url =
        `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes/events`;
    return this.http.get<EventEntity[]>(url, {headers: this.headers});
  }

  patchNodeDeployment(
      nd: NodeDeploymentEntity, patch: NodeDeploymentPatch, clusterId: string, dc: string,
      projectID: string): Observable<NodeDeploymentEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterId}/nodedeployments/${nd.id}`;
    return this.http.patch<NodeDeploymentEntity>(url, patch, {headers: this.headers});
  }

  deleteNodeDeployment(cluster: string, nd: NodeDeploymentEntity, dc: string, projectID: string): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${nd.id}`;
    return this.http.delete(url, {headers: this.headers});
  }

  getProjects(): Observable<ProjectEntity[]> {
    const url = `${this.restRoot}/projects`;
    return this.http.get<ProjectEntity[]>(url, {headers: this.headers});
  }

  createProject(createProjectModel: CreateProjectModel): Observable<ProjectEntity> {
    const url = `${this.restRoot}/projects`;
    return this.http.post<ProjectEntity>(url, createProjectModel, {headers: this.headers});
  }

  editProject(projectID: string, editProjectEntity: EditProjectEntity): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}`;
    return this.http.put(url, editProjectEntity, {headers: this.headers});
  }

  deleteProject(projectID: string): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}`;
    return this.http.delete(url, {headers: this.headers});
  }

  getAllClusters(projectID: string): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/clusters`;
    return this.http.get<ClusterEntity[]>(url, {headers: this.headers});
  }

  getClusters(dc: string, projectID: string): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters`;
    return this.http.get<ClusterEntity[]>(url, {headers: this.headers});
  }

  getCluster(cluster: string, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}`;
    return this.http.get<ClusterEntity>(url, {headers: this.headers});
  }

  createCluster(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters`;
    return this.http.post<ClusterEntity>(url, createClusterModel, {headers: this.headers});
  }

  patchCluster(patch: ClusterEntityPatch, clusterId: string, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterId}`;
    return this.http.patch<ClusterEntity>(url, patch, {headers: this.headers});
  }

  deleteCluster(cluster: string, dc: string, projectID: string, finalizers?: {[key in Finalizer]: boolean}):
      Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}`;
    if (finalizers !== undefined) {
      for (const key of Object.keys(finalizers)) {
        this.headers = this.headers.set(key, finalizers[key].toString());
      }
    }

    return this.http.delete(url, {headers: this.headers});
  }

  getClusterNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes?hideInitialConditions=true`;
    return this.http.get<NodeEntity[]>(url, {headers: this.headers});
  }

  createClusterNode(cluster: ClusterEntity, node: NodeEntity, dc: string, projectID: string): Observable<NodeEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/nodes`;
    return this.http.post<NodeEntity>(url, node, {headers: this.headers});
  }

  deleteClusterNode(cluster: string, node: NodeEntity, dc: string, projectID: string): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes/${node.id}`;
    return this.http.delete(url, {headers: this.headers});
  }

  getClusterSSHKeys(cluster: string, dc: string, projectID: string): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/sshkeys`;
    return this.http.get<SSHKeyEntity[]>(url, {headers: this.headers});
  }

  deleteClusterSSHKey(sshkeyID: string, cluster: string, dc: string, projectID: string): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/sshkeys/${sshkeyID}`;
    return this.http.delete(url, {headers: this.headers});
  }

  addClusterSSHKey(sshkeyID: string, cluster: string, dc: string, projectID: string): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/sshkeys/${sshkeyID}`;
    return this.http.put(url, null, {headers: this.headers});
  }

  getSSHKeys(projectID: string): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/sshkeys`;
    return this.http.get<SSHKeyEntity[]>(url, {headers: this.headers});
  }

  deleteSSHKey(sshkeyID: string, projectID: string): Observable<any> {
    const url = `${this.restRoot}/projects/${projectID}/sshkeys/${sshkeyID}`;
    return this.http.delete(url, {headers: this.headers});
  }

  addSSHKey(sshKey: SSHKeyEntity, projectID: string): Observable<SSHKeyEntity> {
    const url = `${this.restRoot}/projects/${projectID}/sshkeys`;
    return this.http.post<SSHKeyEntity>(url, sshKey, {headers: this.headers});
  }

  getDigitaloceanSizesForWizard(token: string): Observable<DigitaloceanSizes> {
    this.headers = this.headers.set('DoToken', token);
    const url = `${this.restRoot}/providers/digitalocean/sizes`;
    return this.http.get<DigitaloceanSizes>(url, {headers: this.headers});
  }

  getDigitaloceanSizes(projectId: string, dc: string, clusterId: string): Observable<DigitaloceanSizes> {
    const url = `${this.restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/digitalocean/sizes`;
    return this.http.get<DigitaloceanSizes>(url, {headers: this.headers});
  }

  getClusterUpgrades(projectID: string, dc: string, clusterID: string): Observable<MasterVersion[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/upgrades`;
    return this.http.get<MasterVersion[]>(url, {headers: this.headers}).pipe(catchError(() => {
      return of<MasterVersion[]>([]);
    }));
  }

  getClusterNodeUpgrades(projectID: string, dc: string, clusterID: string): Observable<MasterVersion[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/nodes/upgrades`;
    return this.http.get<MasterVersion[]>(url, {headers: this.headers}).pipe(catchError(() => {
      return of<MasterVersion[]>([]);
    }));
  }

  editToken(cluster: ClusterEntity, dc: string, projectID: string, token: Token): Observable<Token> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/token`;
    return this.http.put<Token>(url, token, {headers: this.headers});
  }

  private setOpenStackHeaders(username: string, password: string, domain: string, datacenterName: string): void {
    this.headers = this.headers.set('Username', username);
    this.headers = this.headers.set('Password', password);
    this.headers = this.headers.set('Domain', domain);
    this.headers = this.headers.set('DatacenterName', datacenterName);
  }

  getOpenStackFlavorsForWizard(
      username: string, password: string, tenant: string, domain: string,
      datacenterName: string): Observable<OpenstackFlavor[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this.headers = this.headers.set('Tenant', tenant);
    const url = `${this.restRoot}/providers/openstack/sizes`;
    return this.http.get<OpenstackFlavor[]>(url, {headers: this.headers});
  }

  getOpenStackFlavors(projectId: string, dc: string, cluster: string): Observable<OpenstackFlavor[]> {
    const url = `${this.restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/openstack/sizes`;
    return this.http.get<OpenstackFlavor[]>(url, {headers: this.headers});
  }

  getOpenStackTenantsForWizard(username: string, password: string, domain: string, datacenterName: string):
      Observable<OpenstackTenant[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    const url = `${this.restRoot}/providers/openstack/tenants`;
    return this.http.get<OpenstackTenant[]>(url, {headers: this.headers});
  }

  getOpenStackSecurityGroupsForWizard(
      username: string, password: string, tenant: string, domain: string,
      datacenterName: string): Observable<OpenstackSecurityGroup[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this.headers = this.headers.set('Tenant', tenant);
    const url = `${this.restRoot}/providers/openstack/securitygroups`;
    return this.http.get<OpenstackSecurityGroup[]>(url, {headers: this.headers});
  }

  getOpenStackNetworkForWizard(
      username: string, password: string, tenant: string, domain: string,
      datacenterName: string): Observable<OpenstackNetwork[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this.headers = this.headers.set('Tenant', tenant);
    const url = `${this.restRoot}/providers/openstack/networks`;
    return this.http.get<OpenstackNetwork[]>(url, {headers: this.headers});
  }

  getOpenStackSubnetIdsForWizard(
      username: string, password: string, tenant: string, domain: string, datacenterName: string,
      network: string): Observable<OpenstackSubnet[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this.headers = this.headers.set('Tenant', tenant);
    const url = `${this.restRoot}/providers/openstack/subnets?network_id=${network}`;
    return this.http.get<OpenstackSubnet[]>(url, {headers: this.headers});
  }

  getKubeconfigURL(projectID: string, dc: string, clusterID: string): string {
    return `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/kubeconfig?token=${this.token}`;
  }

  getShareKubeconfigURL(projectID: string, dc: string, clusterID: string, userID: string): string {
    return `${this.location}/${this.restRoot}/kubeconfig?project_id=${projectID}&datacenter=${dc}&cluster_id=${
        clusterID}&user_id=${userID}`;
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    const url = `${this.restRoot}/versions`;
    return this.http.get<MasterVersion[]>(url, {headers: this.headers});
  }

  getAzureSizesForWizard(
      clientID: string, clientSecret: string, subscriptionID: string, tenantID: string,
      location: string): Observable<AzureSizes> {
    this.headers = this.headers.set('ClientID', clientID);
    this.headers = this.headers.set('ClientSecret', clientSecret);
    this.headers = this.headers.set('SubscriptionID', subscriptionID);
    this.headers = this.headers.set('TenantID', tenantID);
    this.headers = this.headers.set('Location', location);
    const url = `${this.restRoot}/providers/azure/sizes`;
    return this.http.get<AzureSizes>(url, {headers: this.headers});
  }

  getAzureSizes(projectId: string, dc: string, cluster: string): Observable<AzureSizes> {
    const url = `${this.restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/azure/sizes`;
    return this.http.get<AzureSizes>(url, {headers: this.headers});
  }

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    this.headers = this.headers.set('Username', username);
    this.headers = this.headers.set('Password', password);
    this.headers = this.headers.set('DatacenterName', datacenterName);
    const url = `${this.restRoot}/providers/vsphere/networks`;
    return this.http.get<VSphereNetwork[]>(url, {headers: this.headers});
  }

  getMembers(projectID: string): Observable<MemberEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/users`;
    return this.http.get<MemberEntity[]>(url, {headers: this.headers});
  }

  createMembers(projectID: string, member: CreateMemberEntity): Observable<MemberEntity> {
    const url = `${this.restRoot}/projects/${projectID}/users`;
    return this.http.post<MemberEntity>(url, member, {headers: this.headers});
  }

  editMembers(projectID: string, member: MemberEntity): Observable<MemberEntity> {
    const url = `${this.restRoot}/projects/${projectID}/users/${member.id}`;
    return this.http.put<MemberEntity>(url, member, {headers: this.headers});
  }

  deleteMembers(projectID: string, member: MemberEntity): any {
    const url = `${this.restRoot}/projects/${projectID}/users/${member.id}`;
    return this.http.delete(url, {headers: this.headers});
  }
}
