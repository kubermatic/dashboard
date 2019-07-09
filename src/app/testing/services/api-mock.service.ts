import {Injectable} from '@angular/core';
import {defer, Observable, of} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';

import {ClusterEntity, MasterVersion, Token} from '../../shared/entity/ClusterEntity';
import {CreateMemberEntity, MemberEntity} from '../../shared/entity/MemberEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {EditProjectEntity, ProjectEntity} from '../../shared/entity/ProjectEntity';
import {DigitaloceanSizes} from '../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {VSphereNetwork} from '../../shared/entity/provider/vsphere/VSphereEntity';
import {CreateServiceAccountEntity, ServiceAccountEntity, ServiceAccountTokenEntity, ServiceAccountTokenPatch} from '../../shared/entity/ServiceAccountEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {fakeDigitaloceanSizes} from '../fake-data/addNodeModal.fake';
import {masterVersionsFake} from '../fake-data/cluster-spec.fake';
import {fakeToken} from '../fake-data/cluster.fake';
import {fakeMember, fakeMembers} from '../fake-data/member.fake';
import {nodeDeploymentsFake, nodesFake} from '../fake-data/node.fake';
import {fakeProject, fakeProjects} from '../fake-data/project.fake';
import {fakeServiceAccount, fakeServiceAccounts, fakeServiceAccountToken, fakeServiceAccountTokens} from '../fake-data/serviceaccount.fake';
import {fakeSSHKeys} from '../fake-data/sshkey.fake';
import {fakeVSphereNetworks} from '../fake-data/vsphere.fake';

@Injectable()
export class ApiMockService {
  project: ProjectEntity = fakeProject();
  projects: ProjectEntity[] = fakeProjects();
  sshKeys: SSHKeyEntity[] = fakeSSHKeys();
  nodes: NodeEntity[] = nodesFake();
  masterVersions: MasterVersion[] = masterVersionsFake();
  token: Token = fakeToken();
  member: MemberEntity = fakeMember();
  members: MemberEntity[] = fakeMembers();
  serviceAccount: ServiceAccountEntity = fakeServiceAccount();
  serviceAccounts: ServiceAccountEntity[] = fakeServiceAccounts();
  serviceAccountToken: ServiceAccountTokenEntity = fakeServiceAccountToken();
  serviceAccountTokens: ServiceAccountTokenEntity[] = fakeServiceAccountTokens();
  vsphereNetworks: VSphereNetwork[] = fakeVSphereNetworks();

  getNodeDeployments(cluster: string, dc: string, projectID: string): Observable<NodeDeploymentEntity[]> {
    return of(nodeDeploymentsFake());
  }

  deleteNodeDeployment(cluster: string, nodeDeployment: string, dc: string, project: string): Observable<any> {
    return of({});
  }

  getNodeDeploymentNodesEvents(ndId: string, cluster: string, dc: string, projectID: string): Observable<any[]> {
    return of([]);
  }

  getProjects(): Observable<ProjectEntity[]> {
    return of(this.projects);
  }

  createProject(): Observable<ProjectEntity> {
    return of(this.project);
  }

  editProject(projectID: string, editProjectEntity: EditProjectEntity): Observable<any> {
    return of(this.project);
  }

  deleteProject(projectID: string): Observable<any> {
    return of(null);
  }

  getSSHKeys(): Observable<SSHKeyEntity[]> {
    return of(this.sshKeys);
  }

  deleteSSHKey(fingerprint: string): Observable<any> {
    return of(null);
  }

  addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    return of(null);
  }

  getToken(cluster: ClusterEntity, dc: string, projectID: string): Observable<Token> {
    return of(this.token);
  }

  editToken(cluster: ClusterEntity, dc: string, projectID: string, token: Token): Observable<Token> {
    return of(this.token);
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    return of(this.masterVersions);
  }

  getMembers(projectID: string): Observable<MemberEntity[]> {
    return of(this.members);
  }

  createMembers(projectID: string, member: CreateMemberEntity): Observable<MemberEntity> {
    return of(this.member);
  }

  editMembers(projectID: string, member: MemberEntity): Observable<MemberEntity> {
    return of(this.member);
  }

  deleteMembers(projectID: string, member: MemberEntity): Observable<any> {
    return of(null);
  }

  getServiceAccounts(projectID: string): Observable<ServiceAccountEntity[]> {
    return of(this.serviceAccounts);
  }

  createServiceAccount(projectID: string, serviceAccount: CreateServiceAccountEntity):
      Observable<ServiceAccountEntity> {
    return of(this.serviceAccount);
  }

  editServiceAccount(projectID: string, serviceAccount: ServiceAccountEntity): Observable<ServiceAccountEntity> {
    return of(this.serviceAccount);
  }

  deleteServiceAccount(projectID: string, serviceAccount: ServiceAccountEntity): Observable<any> {
    return of(null);
  }

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    return of(this.vsphereNetworks);
  }

  getServiceAccountTokens(projectID: string, serviceaccount: ServiceAccountEntity):
      Observable<ServiceAccountTokenEntity[]> {
    return of(this.serviceAccountTokens);
  }

  createServiceAccountToken(projectID: string, serviceaccount: ServiceAccountEntity):
      Observable<ServiceAccountTokenEntity> {
    return of(this.serviceAccountToken);
  }

  editServiceAccountToken(projectID: string, serviceAccount: ServiceAccountEntity, token: ServiceAccountTokenEntity):
      Observable<ServiceAccountTokenEntity> {
    return of(this.serviceAccountToken);
  }

  regenerateServiceAccountToken(
      projectID: string, serviceaccount: ServiceAccountEntity,
      token: ServiceAccountTokenEntity): Observable<ServiceAccountTokenEntity> {
    return of(this.serviceAccountToken);
  }

  patchServiceAccountToken(
      projectID: string, serviceaccount: ServiceAccountEntity, token: ServiceAccountTokenEntity,
      patchToken: ServiceAccountTokenPatch): Observable<ServiceAccountTokenEntity> {
    return of(this.serviceAccountToken);
  }

  deleteServiceAccountToken(projectID: string, serviceaccount: ServiceAccountEntity, token: ServiceAccountTokenEntity):
      Observable<any> {
    return of(null);
  }

  getDigitaloceanSizes(): Observable<DigitaloceanSizes> {
    return of(fakeDigitaloceanSizes());
  }

  getKubeconfigURL(): string {
    return '';
  }
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
