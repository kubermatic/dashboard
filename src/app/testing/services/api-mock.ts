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

import {Injectable} from '@angular/core';
import {defer, Observable, of} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';
import {Cluster, MasterVersion, Token} from '@shared/entity/cluster';
import {CreateMember, Member} from '@shared/entity/member';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Node} from '@shared/entity/node';
import {
  ServiceAccountModel,
  ServiceAccount,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '@shared/entity/service-account';
import {SSHKey} from '@shared/entity/ssh-key';
import {fakeDigitaloceanSizes, fakeEquinixSizes} from '../fake-data/add-node-modal';
import {fakeAlibabaInstanceTypes, fakeAlibabaZones, fakeAlibabaVSwitches} from '../fake-data/alibaba';
import {fakeAnexiaTemplates, fakeAnexiaVlans} from '../fake-data/anexia';
import {masterVersionsFake} from '../fake-data/cluster-spec';
import {fakeToken} from '../fake-data/cluster';
import {fakeMember, fakeMembers} from '../fake-data/member';
import {machineDeploymentsFake, nodesFake} from '../fake-data/node';
import {fakeProject, fakeProjects} from '../fake-data/project';
import {
  fakeServiceAccount,
  fakeServiceAccounts,
  fakeServiceAccountToken,
  fakeServiceAccountTokens,
} from '../fake-data/serviceaccount';
import {fakeSSHKeys} from '../fake-data/sshkey';
import {fakeVSphereNetworks} from '../fake-data/vsphere';
import {EditProject, Project} from '@shared/entity/project';
import {VSphereNetwork} from '@shared/entity/provider/vsphere';
import {AlibabaInstanceType, AlibabaZone, AlibabaVSwitch} from '@shared/entity/provider/alibaba';
import {AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';
import {EquinixSize} from '@shared/entity/provider/equinix';
import {GCPDiskType, GCPMachineSize, GCPNetwork, GCPSubnetwork, GCPZone} from '@shared/entity/provider/gcp';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';

@Injectable()
export class ApiMockService {
  project: Project = fakeProject();
  projects: Project[] = fakeProjects();
  sshKeys: SSHKey[] = fakeSSHKeys();
  nodes: Node[] = nodesFake();
  masterVersions: MasterVersion[] = masterVersionsFake();
  token: Token = fakeToken();
  member: Member = fakeMember();
  members: Member[] = fakeMembers();
  serviceAccount: ServiceAccount = fakeServiceAccount();
  serviceAccounts: ServiceAccount[] = fakeServiceAccounts();
  serviceAccountToken: ServiceAccountToken = fakeServiceAccountToken();
  serviceAccountTokens: ServiceAccountToken[] = fakeServiceAccountTokens();
  vsphereNetworks: VSphereNetwork[] = fakeVSphereNetworks();

  get addonConfigs(): Observable<any> {
    return of([]);
  }

  getAccessibleAddons(): Observable<string[]> {
    return of([]);
  }

  getMachineDeployments(_cluster: string, _dc: string, _projectID: string): Observable<MachineDeployment[]> {
    return of(machineDeploymentsFake());
  }

  deleteMachineDeployment(
    _cluster: string,
    _machineDeployment: string,
    _dc: string,
    _project: string
  ): Observable<any> {
    return of({});
  }

  getMachineDeploymentNodesEvents(_mdId: string, _cluster: string, _dc: string, _projectID: string): Observable<any[]> {
    return of([]);
  }

  getProjects(): Observable<Project[]> {
    return of(this.projects);
  }

  createProject(): Observable<Project> {
    return of(this.project);
  }

  editProject(_projectID: string, _editProjectEntity: EditProject): Observable<any> {
    return of(this.project);
  }

  deleteProject(_projectID: string): Observable<any> {
    return of(null);
  }

  getSSHKeys(): Observable<SSHKey[]> {
    return of(this.sshKeys);
  }

  deleteSSHKey(_fingerprint: string): Observable<any> {
    return of(null);
  }

  addSSHKey(_sshKey: SSHKey): Observable<SSHKey> {
    return of(null);
  }

  getToken(_cluster: Cluster, _dc: string, _projectID: string): Observable<Token> {
    return of(this.token);
  }

  editToken(_cluster: Cluster, _dc: string, _projectID: string, _token: Token): Observable<Token> {
    return of(this.token);
  }

  editViewerToken(_cluster: Cluster, _dc: string, _projectID: string, _token: Token): Observable<Token> {
    return of(this.token);
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    return of(this.masterVersions);
  }

  getMembers(_projectID: string): Observable<Member[]> {
    return of(this.members);
  }

  createMembers(_projectID: string, _member: CreateMember): Observable<Member> {
    return of(this.member);
  }

  editMembers(_projectID: string, _member: Member): Observable<Member> {
    return of(this.member);
  }

  deleteMembers(_projectID: string, _member: Member): Observable<any> {
    return of(null);
  }

  getServiceAccounts(_projectID: string): Observable<ServiceAccount[]> {
    return of(this.serviceAccounts);
  }

  createServiceAccount(_projectID: string, _serviceAccount: ServiceAccountModel): Observable<ServiceAccount> {
    return of(this.serviceAccount);
  }

  editServiceAccount(_projectID: string, _serviceAccount: ServiceAccount): Observable<ServiceAccount> {
    return of(this.serviceAccount);
  }

  deleteServiceAccount(_projectID: string, _serviceAccount: ServiceAccount): Observable<any> {
    return of(null);
  }

  getVSphereNetworks(_username: string, _password: string, _datacenterName: string): Observable<VSphereNetwork[]> {
    return of(this.vsphereNetworks);
  }

  getServiceAccountTokens(_projectID: string, _serviceaccount: ServiceAccount): Observable<ServiceAccountToken[]> {
    return of(this.serviceAccountTokens);
  }

  createServiceAccountToken(_projectID: string, _serviceaccount: ServiceAccount): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  editServiceAccountToken(
    _projectID: string,
    _serviceAccount: ServiceAccount,
    _token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  regenerateServiceAccountToken(
    _projectID: string,
    _serviceaccount: ServiceAccount,
    _token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  patchServiceAccountToken(
    _projectID: string,
    _serviceaccount: ServiceAccount,
    _token: ServiceAccountToken,
    _patchToken: ServiceAccountTokenPatch
  ): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  deleteServiceAccountToken(
    _projectID: string,
    _serviceaccount: ServiceAccount,
    _token: ServiceAccountToken
  ): Observable<any> {
    return of(null);
  }

  getDigitaloceanSizes(): Observable<DigitaloceanSizes> {
    return of(fakeDigitaloceanSizes());
  }

  getGCPSizes(_zone: string, _projectId: string, _dc: string, _clusterId: string): Observable<GCPMachineSize[]> {
    return of([]);
  }

  getGCPDiskTypes(_zone: string, _projectId: string, _dc: string, _clusterId: string): Observable<GCPDiskType[]> {
    return of([]);
  }

  getGCPZones(_projectId: string, _dc: string, _clusterId: string): Observable<GCPZone[]> {
    return of([]);
  }

  getGCPNetworks(_projectId: string, _dc: string, _clusterId: string): Observable<GCPNetwork[]> {
    return of([]);
  }

  getGCPSubnetworks(
    _projectId: string,
    _dc: string,
    _clusterId: string,
    _network: string
  ): Observable<GCPSubnetwork[]> {
    return of([]);
  }

  getKubeconfigURL(): string {
    return '';
  }

  getEquinixSizes(): Observable<EquinixSize[]> {
    return of(fakeEquinixSizes());
  }

  getAlibabaInstanceTypes(): Observable<AlibabaInstanceType[]> {
    return of(fakeAlibabaInstanceTypes());
  }

  getAlibabaZones(): Observable<AlibabaZone[]> {
    return of(fakeAlibabaZones());
  }

  getAlibabaVSwitches(): Observable<AlibabaVSwitch[]> {
    return of(fakeAlibabaVSwitches());
  }

  getAnexiaVlans(): Observable<AnexiaVlan[]> {
    return of(fakeAnexiaVlans());
  }

  getAnexiaTemplates(): Observable<AnexiaTemplate[]> {
    return of(fakeAnexiaTemplates());
  }

  getDashboardProxyURL(): string {
    return '';
  }

  getAdmissionPlugins(_version: string): Observable<string[]> {
    return of(['PodNodeSecurity', 'PodSecurityPolicy']);
  }
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
