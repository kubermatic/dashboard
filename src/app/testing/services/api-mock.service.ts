import {Injectable} from '@angular/core';
import {defer, Observable, of} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';

import {Cluster, MasterVersion, Token} from '../../shared/entity/cluster';
import {CreateMember, Member} from '../../shared/entity/member';
import {NodeDeployment} from '../../shared/entity/node-deployment';
import {Node} from '../../shared/entity/node';
import {
  ServiceAccountModel,
  ServiceAccount,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '../../shared/entity/service-account';
import {SSHKey} from '../../shared/entity/ssh-key';
import {fakeDigitaloceanSizes, fakePacketSizes} from '../fake-data/addNodeModal.fake';
import {fakeAlibabaInstanceTypes, fakeAlibabaZones} from '../fake-data/alibaba.fake';
import {masterVersionsFake} from '../fake-data/cluster-spec.fake';
import {fakeToken} from '../fake-data/cluster.fake';
import {fakeMember, fakeMembers} from '../fake-data/member.fake';
import {nodeDeploymentsFake, nodesFake} from '../fake-data/node.fake';
import {fakeProject, fakeProjects} from '../fake-data/project.fake';
import {
  fakeServiceAccount,
  fakeServiceAccounts,
  fakeServiceAccountToken,
  fakeServiceAccountTokens,
} from '../fake-data/serviceaccount.fake';
import {fakeSSHKeys} from '../fake-data/sshkey.fake';
import {fakeVSphereNetworks} from '../fake-data/vsphere.fake';
import {EditProject, Project} from '../../shared/entity/project';
import {VSphereNetwork} from '../../shared/entity/provider/vsphere';
import {AlibabaInstanceType, AlibabaZone} from '../../shared/entity/provider/alibaba';
import {PacketSize} from '../../shared/entity/provider/packet';
import {GCPDiskType, GCPMachineSize, GCPNetwork, GCPSubnetwork, GCPZone} from '../../shared/entity/provider/gcp';
import {DigitaloceanSizes} from '../../shared/entity/provider/digitalocean';

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

  getNodeDeployments(cluster: string, dc: string, projectID: string): Observable<NodeDeployment[]> {
    return of(nodeDeploymentsFake());
  }

  deleteNodeDeployment(cluster: string, nodeDeployment: string, dc: string, project: string): Observable<any> {
    return of({});
  }

  getNodeDeploymentNodesEvents(ndId: string, cluster: string, dc: string, projectID: string): Observable<any[]> {
    return of([]);
  }

  getProjects(): Observable<Project[]> {
    return of(this.projects);
  }

  createProject(): Observable<Project> {
    return of(this.project);
  }

  editProject(projectID: string, editProjectEntity: EditProject): Observable<any> {
    return of(this.project);
  }

  deleteProject(projectID: string): Observable<any> {
    return of(null);
  }

  getSSHKeys(): Observable<SSHKey[]> {
    return of(this.sshKeys);
  }

  deleteSSHKey(fingerprint: string): Observable<any> {
    return of(null);
  }

  addSSHKey(sshKey: SSHKey): Observable<SSHKey> {
    return of(null);
  }

  getToken(cluster: Cluster, dc: string, projectID: string): Observable<Token> {
    return of(this.token);
  }

  editToken(cluster: Cluster, dc: string, projectID: string, token: Token): Observable<Token> {
    return of(this.token);
  }

  editViewerToken(cluster: Cluster, dc: string, projectID: string, token: Token): Observable<Token> {
    return of(this.token);
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    return of(this.masterVersions);
  }

  getMembers(projectID: string): Observable<Member[]> {
    return of(this.members);
  }

  createMembers(projectID: string, member: CreateMember): Observable<Member> {
    return of(this.member);
  }

  editMembers(projectID: string, member: Member): Observable<Member> {
    return of(this.member);
  }

  deleteMembers(projectID: string, member: Member): Observable<any> {
    return of(null);
  }

  getServiceAccounts(projectID: string): Observable<ServiceAccount[]> {
    return of(this.serviceAccounts);
  }

  createServiceAccount(projectID: string, serviceAccount: ServiceAccountModel): Observable<ServiceAccount> {
    return of(this.serviceAccount);
  }

  editServiceAccount(projectID: string, serviceAccount: ServiceAccount): Observable<ServiceAccount> {
    return of(this.serviceAccount);
  }

  deleteServiceAccount(projectID: string, serviceAccount: ServiceAccount): Observable<any> {
    return of(null);
  }

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    return of(this.vsphereNetworks);
  }

  getServiceAccountTokens(projectID: string, serviceaccount: ServiceAccount): Observable<ServiceAccountToken[]> {
    return of(this.serviceAccountTokens);
  }

  createServiceAccountToken(projectID: string, serviceaccount: ServiceAccount): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  editServiceAccountToken(
    projectID: string,
    serviceAccount: ServiceAccount,
    token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  regenerateServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  patchServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: ServiceAccountToken,
    patchToken: ServiceAccountTokenPatch
  ): Observable<ServiceAccountToken> {
    return of(this.serviceAccountToken);
  }

  deleteServiceAccountToken(
    projectID: string,
    serviceaccount: ServiceAccount,
    token: ServiceAccountToken
  ): Observable<any> {
    return of(null);
  }

  getDigitaloceanSizes(): Observable<DigitaloceanSizes> {
    return of(fakeDigitaloceanSizes());
  }

  getGCPSizes(zone: string, projectId: string, dc: string, clusterId: string): Observable<GCPMachineSize[]> {
    return of([]);
  }

  getGCPDiskTypes(zone: string, projectId: string, dc: string, clusterId: string): Observable<GCPDiskType[]> {
    return of([]);
  }

  getGCPZones(projectId: string, dc: string, clusterId: string): Observable<GCPZone[]> {
    return of([]);
  }

  getGCPNetworks(projectId: string, dc: string, clusterId: string): Observable<GCPNetwork[]> {
    return of([]);
  }

  getGCPSubnetworks(projectId: string, dc: string, clusterId: string, network: string): Observable<GCPSubnetwork[]> {
    return of([]);
  }

  getKubeconfigURL(): string {
    return '';
  }

  getPacketSizes(): Observable<PacketSize[]> {
    return of(fakePacketSizes());
  }

  getAlibabaInstanceTypes(): Observable<AlibabaInstanceType[]> {
    return of(fakeAlibabaInstanceTypes());
  }

  getAlibabaZones(): Observable<AlibabaZone[]> {
    return of(fakeAlibabaZones());
  }

  getDashboardProxyURL(): string {
    return '';
  }

  getOpenshiftProxyURL(): string {
    return '';
  }
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
