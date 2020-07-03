// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of, timer} from 'rxjs';
import {catchError, shareReplay, switchMap} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {LabelFormComponent} from '../../../shared/components/label-form/label-form.component';
import {TaintFormComponent} from '../../../shared/components/taint-form/taint-form.component';
import {AddonConfig} from '../../../shared/entity/addon';
import {Cluster, ClusterType, MasterVersion, Token} from '../../../shared/entity/cluster';
import {Event} from '../../../shared/entity/event';
import {CreateMember, Member} from '../../../shared/entity/member';
import {NodeMetrics} from '../../../shared/entity/metrics';
import {NodeDeployment, NodeDeploymentPatch} from '../../../shared/entity/node-deployment';
import {Node} from '../../../shared/entity/node';
import {EditProject, Project} from '../../../shared/entity/project';
import {
  ServiceAccountModel,
  CreateTokenEntity,
  ServiceAccount,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '../../../shared/entity/service-account';
import {SSHKey} from '../../../shared/entity/ssh-key';
import {CreateProjectModel} from '../../../shared/model/CreateProjectModel';
import {Auth} from '../auth/auth.service';
import {DigitaloceanSizes} from '../../../shared/entity/provider/digitalocean';
import {HetznerTypes} from '../../../shared/entity/provider/hetzner';
import {PacketSize} from '../../../shared/entity/provider/packet';
import {AlibabaInstanceType, AlibabaZone} from '../../../shared/entity/provider/alibaba';
import {AWSSize, AWSSubnet} from '../../../shared/entity/provider/aws';
import {GCPDiskType, GCPMachineSize, GCPNetwork, GCPSubnetwork, GCPZone} from '../../../shared/entity/provider/gcp';
import {OpenstackFlavor, OpenstackAvailabilityZone} from '../../../shared/entity/provider/openstack';
import {AzureSizes, AzureZones} from '../../../shared/entity/provider/azure';

@Injectable()
export class ApiService {
  private _location: string = window.location.protocol + '//' + window.location.host;
  private _restRoot: string = environment.restRoot;
  private readonly _token: string;
  private _addonConfigs$: Observable<any>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 30);

  constructor(
    private readonly _http: HttpClient,
    private readonly _auth: Auth,
    private readonly _appConfig: AppConfigService
  ) {
    this._token = this._auth.getBearerToken();
  }

  get addonConfigs(): Observable<AddonConfig[]> {
    if (!this._addonConfigs$) {
      this._addonConfigs$ = this._refreshTimer$
        .pipe(switchMap(() => this._http.get(`${this._restRoot}/addonconfigs`)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._addonConfigs$;
  }

  createNodeDeployment(
    cluster: Cluster,
    nd: NodeDeployment,
    dc: string,
    projectID: string
  ): Observable<NodeDeployment> {
    nd.spec.template.labels = LabelFormComponent.filterNullifiedKeys(nd.spec.template.labels);
    nd.spec.template.taints = TaintFormComponent.filterNullifiedTaints(nd.spec.template.taints);

    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/nodedeployments`;
    return this._http.post<NodeDeployment>(url, nd);
  }

  getNodeDeployments(cluster: string, dc: string, projectID: string): Observable<NodeDeployment[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments`;
    return this._http.get<NodeDeployment[]>(url).pipe(catchError(() => of<NodeDeployment[]>()));
  }

  getNodeDeployment(ndId: string, cluster: string, dc: string, projectID: string): Observable<NodeDeployment> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}`;
    return this._http.get<NodeDeployment>(url);
  }

  getNodeDeploymentNodes(ndId: string, cluster: string, dc: string, projectID: string): Observable<Node[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes`;
    return this._http.get<Node[]>(url);
  }
  getNodeDeploymentNodesMetrics(
    ndId: string,
    cluster: string,
    dc: string,
    projectID: string
  ): Observable<NodeMetrics[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes/metrics`;
    return this._http.get<NodeMetrics[]>(url);
  }

  getNodeDeploymentNodesEvents(ndId: string, cluster: string, dc: string, projectID: string): Observable<Event[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${ndId}/nodes/events`;
    return this._http.get<Event[]>(url);
  }

  patchNodeDeployment(
    nd: NodeDeployment,
    patch: NodeDeploymentPatch,
    clusterId: string,
    dc: string,
    projectID: string
  ): Observable<NodeDeployment> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterId}/nodedeployments/${nd.id}`;
    return this._http.patch<NodeDeployment>(url, patch);
  }

  deleteNodeDeployment(cluster: string, nd: NodeDeployment, dc: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodedeployments/${nd.id}`;
    return this._http.delete(url);
  }

  createProject(createProjectModel: CreateProjectModel): Observable<Project> {
    const url = `${this._restRoot}/projects`;
    return this._http.post<Project>(url, createProjectModel);
  }

  editProject(projectID: string, editProjectEntity: EditProject): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}`;
    return this._http.put(url, editProjectEntity);
  }

  getSSHKeys(projectID: string): Observable<SSHKey[]> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys`;
    return this._http.get<SSHKey[]>(url);
  }

  deleteSSHKey(sshkeyID: string, projectID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys/${sshkeyID}`;
    return this._http.delete(url);
  }

  addSSHKey(sshKey: SSHKey, projectID: string): Observable<SSHKey> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys`;
    return this._http.post<SSHKey>(url, sshKey);
  }

  getDigitaloceanSizes(projectId: string, dc: string, clusterId: string): Observable<DigitaloceanSizes> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/digitalocean/sizes`;
    return this._http.get<DigitaloceanSizes>(url);
  }

  getHetznerTypes(projectId: string, dc: string, clusterId: string): Observable<HetznerTypes> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/hetzner/sizes`;
    return this._http.get<HetznerTypes>(url);
  }

  getPacketSizes(projectId: string, dc: string, clusterId: string): Observable<PacketSize[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/packet/sizes`;
    return this._http.get<PacketSize[]>(url);
  }

  getAlibabaInstanceTypes(
    projectId: string,
    dc: string,
    clusterId: string,
    region: string
  ): Observable<AlibabaInstanceType[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/alibaba/instancetypes`;
    const headers = new HttpHeaders().set('Region', region);
    return this._http.get<AlibabaInstanceType[]>(url, {headers});
  }

  getAlibabaZones(projectId: string, dc: string, clusterId: string, region: string): Observable<AlibabaZone[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/alibaba/zones`;
    const headers = new HttpHeaders().set('Region', region);
    return this._http.get<AlibabaZone[]>(url, {headers});
  }

  editToken(cluster: Cluster, dc: string, projectID: string, token: Token): Observable<Token> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/token`;
    return this._http.put<Token>(url, token);
  }

  editViewerToken(cluster: Cluster, dc: string, projectID: string, token: Token): Observable<Token> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/viewertoken`;
    return this._http.put<Token>(url, token);
  }

  getAWSSubnets(projectId: string, dc: string, clusterId: string): Observable<AWSSubnet[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/aws/subnets`;
    return this._http.get<AWSSubnet[]>(url);
  }

  getAWSSizes(projectId: string, dc: string, clusterId: string): Observable<AWSSize[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/aws/sizes`;
    return this._http.get<AWSSize[]>(url);
  }

  getGCPZones(projectId: string, dc: string, clusterId: string): Observable<GCPZone[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/gcp/zones`;
    return this._http.get<GCPZone[]>(url);
  }

  getGCPSizes(zone: string, projectId: string, dc: string, clusterId: string): Observable<GCPMachineSize[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/gcp/sizes`;
    const headers = new HttpHeaders().set('Zone', zone);
    return this._http.get<GCPMachineSize[]>(url, {headers});
  }

  getGCPDiskTypes(zone: string, projectId: string, dc: string, clusterId: string): Observable<GCPDiskType[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/gcp/disktypes`;
    const headers = new HttpHeaders().set('Zone', zone);
    return this._http.get<GCPDiskType[]>(url, {headers});
  }

  getGCPNetworks(projectId: string, dc: string, clusterId: string): Observable<GCPNetwork[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/gcp/networks`;
    return this._http.get<GCPNetwork[]>(url);
  }

  getGCPSubnetworks(projectId: string, dc: string, clusterId: string, network: string): Observable<GCPSubnetwork[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${clusterId}/providers/gcp/subnetworks`;
    const headers = new HttpHeaders().set('Network', network);
    return this._http.get<GCPSubnetwork[]>(url, {headers});
  }

  getOpenStackFlavors(projectId: string, dc: string, cluster: string): Observable<OpenstackFlavor[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/openstack/sizes`;
    return this._http.get<OpenstackFlavor[]>(url);
  }

  getOpenStackAvailabilityZones(
    projectId: string,
    dc: string,
    cluster: string
  ): Observable<OpenstackAvailabilityZone[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/openstack/availabilityzones`;
    return this._http.get<OpenstackAvailabilityZone[]>(url);
  }

  getKubeconfigURL(projectID: string, dc: string, clusterID: string): string {
    return `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/kubeconfig?token=${this._token}`;
  }

  getDashboardProxyURL(projectID: string, dc: string, clusterID: string): string {
    return `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/dashboard/proxy`;
  }

  getOpenshiftProxyURL(projectID: string, dc: string, clusterID: string): string {
    return `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${clusterID}/openshift/console/login`;
  }

  getShareKubeconfigURL(projectID: string, dc: string, clusterID: string, userID: string): string {
    return `${this._location}/${this._restRoot}/kubeconfig?project_id=${projectID}&datacenter=${dc}&cluster_id=${clusterID}&user_id=${userID}`;
  }

  getMasterVersions(type: ClusterType): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/upgrades/cluster?type=${type}`;
    return this._http.get<MasterVersion[]>(url);
  }

  getAdmissionPlugins(version: string): Observable<string[]> {
    const url = `${this._restRoot}/admission/plugins/${version}`;
    return this._http.get<string[]>(url);
  }

  getAzureSizes(projectId: string, dc: string, cluster: string): Observable<AzureSizes[]> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/azure/sizes`;
    return this._http.get<AzureSizes[]>(url);
  }

  getAzureAvailabilityZones(projectId: string, dc: string, cluster: string, size: string): Observable<AzureZones> {
    const url = `${this._restRoot}/projects/${projectId}/dc/${dc}/clusters/${cluster}/providers/azure/availabilityzones`;
    const headers = new HttpHeaders().set('SKUName', size);
    return this._http.get<AzureZones>(url, {headers});
  }

  getMembers(projectID: string): Observable<Member[]> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._http.get<Member[]>(url);
  }

  createMembers(projectID: string, member: CreateMember): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._http.post<Member>(url, member);
  }

  editMembers(projectID: string, member: Member): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._http.put<Member>(url, member);
  }

  deleteMembers(projectID: string, member: Member): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._http.delete(url);
  }

  getServiceAccounts(projectID: string): Observable<ServiceAccount[]> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts`;
    return this._http.get<ServiceAccount[]>(url);
  }

  createServiceAccount(projectID: string, serviceaccount: ServiceAccountModel): Observable<ServiceAccount> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts`;
    return this._http.post<ServiceAccount>(url, serviceaccount);
  }

  editServiceAccount(projectID: string, serviceaccount: ServiceAccount): Observable<ServiceAccount> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}`;
    return this._http.put<ServiceAccount>(url, serviceaccount);
  }

  deleteServiceAccount(projectID: string, serviceaccount: ServiceAccount): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}`;
    return this._http.delete(url);
  }

  getServiceAccountTokens(projectID: string, serviceaccount: ServiceAccount): Observable<ServiceAccountToken[]> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens`;
    return this._http.get<ServiceAccountToken[]>(url);
  }

  createServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: CreateTokenEntity
  ): Observable<ServiceAccountToken> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens`;
    return this._http.post<ServiceAccountToken>(url, token);
  }

  regenerateServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens/${token.id}`;
    return this._http.put<ServiceAccountToken>(url, token);
  }

  patchServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: ServiceAccountToken,
    patchToken: ServiceAccountTokenPatch
  ): Observable<ServiceAccountToken> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens/${token.id}`;
    return this._http.patch<ServiceAccountToken>(url, patchToken);
  }

  deleteServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: ServiceAccountToken
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${serviceaccount.id}/tokens/${token.id}`;
    return this._http.delete(url);
  }

  getAccessibleAddons(): Observable<string[]> {
    const url = `${this._restRoot}/addons`;
    return this._http.get<string[]>(url);
  }

  getSwaggerJson(): Observable<any> {
    const url = '/api/swagger.json';
    return this._http.get(url);
  }
}
