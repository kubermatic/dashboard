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
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {LabelFormComponent} from '@shared/components/label-form/component';
import {TaintFormComponent} from '@shared/components/taint-form/component';
import {AddonConfig} from '@shared/entity/addon';
import {Cluster, MasterVersion, Token} from '@shared/entity/cluster';
import {Event} from '@shared/entity/event';
import {MachineDeployment, MachineDeploymentPatch} from '@shared/entity/machine-deployment';
import {CreateMember, Member} from '@shared/entity/member';
import {NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {EditProject, Project} from '@shared/entity/project';
import {AlibabaInstanceType, AlibabaVSwitch, AlibabaZone} from '@shared/entity/provider/alibaba';
import {AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';
import {AWSSize, AWSSubnet} from '@shared/entity/provider/aws';
import {AzureSizes, AzureZones} from '@shared/entity/provider/azure';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';
import {GCPDiskType, GCPMachineSize, GCPZone} from '@shared/entity/provider/gcp';
import {HetznerTypes} from '@shared/entity/provider/hetzner';
import {OpenstackAvailabilityZone, OpenstackFlavor} from '@shared/entity/provider/openstack';
import {EquinixSize} from '@shared/entity/provider/equinix';
import {
  CreateTokenEntity,
  ServiceAccount,
  ServiceAccountModel,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '@shared/entity/service-account';
import {SSHKey} from '@shared/entity/ssh-key';
import {CreateProjectModel} from '@shared/model/CreateProjectModel';
import {Observable, of, timer} from 'rxjs';
import {catchError, shareReplay, switchMap} from 'rxjs/operators';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

@Injectable()
export class ApiService {
  private readonly _refreshTime = 30; // in seconds
  private _location: string = window.location.protocol + '//' + window.location.host;
  private _restRoot: string = environment.restRoot;
  private _newRestRoot: string = environment.newRestRoot;
  private _addonConfigs$: Observable<any>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);

  constructor(private readonly _http: HttpClient, private readonly _appConfig: AppConfigService) {}

  get addonConfigs(): Observable<AddonConfig[]> {
    if (!this._addonConfigs$) {
      this._addonConfigs$ = this._refreshTimer$
        .pipe(switchMap(() => this._http.get(`${this._restRoot}/addonconfigs`)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._addonConfigs$;
  }

  createMachineDeployment(md: MachineDeployment, clusterID: string, projectID: string): Observable<MachineDeployment> {
    md.spec.template.labels = LabelFormComponent.filterNullifiedKeys(md.spec.template.labels);
    md.spec.template.taints = TaintFormComponent.filterNullifiedTaints(md.spec.template.taints);

    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/machinedeployments`;
    return this._http.post<MachineDeployment>(url, md);
  }

  getMachineDeployments(cluster: string, projectID: string): Observable<MachineDeployment[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments`;
    return this._http.get<MachineDeployment[]>(url).pipe(catchError(() => of<MachineDeployment[]>()));
  }

  getMachineDeployment(mdId: string, cluster: string, projectID: string): Observable<MachineDeployment> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}`;
    return this._http.get<MachineDeployment>(url);
  }

  getMachineDeploymentNodes(mdId: string, cluster: string, projectID: string): Observable<Node[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/nodes`;
    return this._http.get<Node[]>(url);
  }

  getMachineDeploymentNodesMetrics(mdId: string, cluster: string, projectID: string): Observable<NodeMetrics[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/nodes/metrics`;
    return this._http.get<NodeMetrics[]>(url);
  }

  getMachineDeploymentNodesEvents(mdId: string, cluster: string, projectID: string): Observable<Event[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/nodes/events`;
    return this._http.get<Event[]>(url);
  }

  patchMachineDeployment(
    patch: MachineDeploymentPatch,
    machineDeploymentId: string,
    clusterId: string,
    projectID: string
  ): Observable<MachineDeployment> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterId}/machinedeployments/${machineDeploymentId}`;
    return this._http.patch<MachineDeployment>(url, patch);
  }

  deleteMachineDeployment(cluster: string, md: MachineDeployment, projectID: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${md.id}`;
    return this._http.delete(url);
  }

  restartMachineDeployment(cluster: string, md: MachineDeployment, projectID: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${md.id}/restart`;
    return this._http.post(url, {});
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

  getDigitaloceanSizes(projectId: string, clusterId: string): Observable<DigitaloceanSizes> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/digitalocean/sizes`;
    return this._http.get<DigitaloceanSizes>(url);
  }

  getHetznerTypes(projectId: string, clusterId: string): Observable<HetznerTypes> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/hetzner/sizes`;
    return this._http.get<HetznerTypes>(url);
  }

  getEquinixSizes(projectId: string, clusterId: string): Observable<EquinixSize[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/packet/sizes`;
    return this._http.get<EquinixSize[]>(url);
  }

  getAlibabaInstanceTypes(projectId: string, clusterId: string, region: string): Observable<AlibabaInstanceType[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/alibaba/instancetypes`;
    const headers = new HttpHeaders().set('Region', region);
    return this._http.get<AlibabaInstanceType[]>(url, {headers});
  }

  getAlibabaZones(projectId: string, clusterId: string, region: string): Observable<AlibabaZone[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/alibaba/zones`;
    const headers = new HttpHeaders().set('Region', region);
    return this._http.get<AlibabaZone[]>(url, {headers});
  }

  getAlibabaVSwitches(projectId: string, clusterId: string, region: string): Observable<AlibabaVSwitch[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/alibaba/vswitches`;
    const headers = new HttpHeaders().set('Region', region);
    return this._http.get<AlibabaVSwitch[]>(url, {headers});
  }

  getAnexiaVlans(projectId: string, clusterId: string): Observable<AnexiaVlan[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/anexia/vlans`;
    return this._http.get<AnexiaVlan[]>(url);
  }

  getAnexiaTemplates(projectId: string, clusterId: string, location: string): Observable<AnexiaTemplate[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/anexia/templates`;
    const headers = new HttpHeaders().set('Location', location);
    return this._http.get<AnexiaTemplate[]>(url, {headers});
  }

  editToken(cluster: Cluster, projectID: string, token: Token): Observable<Token> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster.id}/token`;
    return this._http.put<Token>(url, token);
  }

  editViewerToken(cluster: Cluster, projectID: string, token: Token): Observable<Token> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${cluster.id}/viewertoken`;
    return this._http.put<Token>(url, token);
  }

  getAWSSubnets(projectId: string, clusterId: string): Observable<AWSSubnet[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/aws/subnets`;
    return this._http.get<AWSSubnet[]>(url);
  }

  getAWSSizes(projectId: string, clusterId: string): Observable<AWSSize[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/aws/sizes`;
    return this._http.get<AWSSize[]>(url);
  }

  getGCPZones(projectId: string, clusterId: string): Observable<GCPZone[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/gcp/zones`;
    return this._http.get<GCPZone[]>(url);
  }

  getGCPSizes(zone: string, projectId: string, clusterId: string): Observable<GCPMachineSize[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/gcp/sizes`;
    const headers = new HttpHeaders().set('Zone', zone);
    return this._http.get<GCPMachineSize[]>(url, {headers});
  }

  getGCPDiskTypes(zone: string, projectId: string, clusterId: string): Observable<GCPDiskType[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/providers/gcp/disktypes`;
    const headers = new HttpHeaders().set('Zone', zone);
    return this._http.get<GCPDiskType[]>(url, {headers});
  }

  getOpenStackFlavors(projectId: string, cluster: string): Observable<OpenstackFlavor[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${cluster}/providers/openstack/sizes`;
    return this._http.get<OpenstackFlavor[]>(url);
  }

  getOpenStackAvailabilityZones(projectId: string, cluster: string): Observable<OpenstackAvailabilityZone[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${cluster}/providers/openstack/availabilityzones`;
    return this._http.get<OpenstackAvailabilityZone[]>(url);
  }

  getKubeconfigURL(projectID: string, clusterID: string): string {
    return `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/kubeconfig`;
  }

  getDashboardProxyURL(projectID: string, clusterID: string): string {
    return `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/dashboard/proxy`;
  }

  getShareKubeconfigURL(projectID: string, seed: string, clusterID: string, userID: string): string {
    return `${this._location}/${this._restRoot}/kubeconfig?project_id=${projectID}&datacenter=${seed}&cluster_id=${clusterID}&user_id=${userID}`;
  }

  getMasterVersions(provider: NodeProvider): Observable<MasterVersion[]> {
    const url = `${this._newRestRoot}/providers/${provider}/versions`;
    return this._http.get<MasterVersion[]>(url);
  }

  getAdmissionPlugins(version: string): Observable<string[]> {
    const url = `${this._restRoot}/admission/plugins/${version}`;
    return this._http.get<string[]>(url);
  }

  getAzureSizes(projectId: string, cluster: string): Observable<AzureSizes[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${cluster}/providers/azure/sizes`;
    return this._http.get<AzureSizes[]>(url);
  }

  getAzureAvailabilityZones(projectId: string, cluster: string, size: string): Observable<AzureZones> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${cluster}/providers/azure/availabilityzones`;
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
