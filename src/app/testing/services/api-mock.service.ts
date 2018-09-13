import { Injectable } from '@angular/core';
import { Observable, of, defer } from 'rxjs';
import { ClusterEntity, MasterVersion, Token } from './../../shared/entity/ClusterEntity';
import { ProjectEntity } from './../../shared/entity/ProjectEntity';
import { NodeEntity } from '../../shared/entity/NodeEntity';
import { MemberEntity, CreateMemberEntity } from '../../shared/entity/MemberEntity';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { VSphereNetwork } from '../../shared/entity/provider/vsphere/VSphereEntity';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { nodesFake } from './../fake-data/node.fake';
import { fakeSSHKeys } from './../fake-data/sshkey.fake';
import { fakeClusters, fakeDigitaloceanCluster, fakeToken } from './../fake-data/cluster.fake';
import { fakeProject, fakeProjects } from './../fake-data/project.fake';
import { fakeMember, fakeMembers } from './../fake-data/member.fake';
import { fakeVSphereNetworks } from './../fake-data/vsphere.fake';
import { masterVersionsFake } from './../fake-data/cluster-spec.fake';

@Injectable()
export class ApiMockService {
  public cluster: ClusterEntity = fakeDigitaloceanCluster();
  public clusters: ClusterEntity[] = fakeClusters();
  public project: ProjectEntity = fakeProject();
  public projects: ProjectEntity[] = fakeProjects();
  public sshKeys: SSHKeyEntity[] = fakeSSHKeys();
  public nodes: NodeEntity[] = nodesFake();
  public masterVersions: MasterVersion[] = masterVersionsFake();
  public token: Token = fakeToken();
  public member: MemberEntity = fakeMember();
  public members: MemberEntity[] = fakeMembers();
  public vsphereNetworks: VSphereNetwork[] = fakeVSphereNetworks();

  constructor() {
  }

  public getProjects(): Observable<ProjectEntity[]> {
    return of(this.projects);
  }

  public createProject(): Observable<ProjectEntity> {
    return of(this.project);
  }

  public deleteProject(projectID: string): Observable<any> {
    return of(null);
  }

  public getCluster(clusterId: string, dc: string, projectID: string): Observable<ClusterEntity> {
    return of(this.cluster);
  }

  public getClusters(dc: string, projectID: string): Observable<ClusterEntity[]> {
    return of(this.clusters);
  }

  public getSSHKeys(): Observable<SSHKeyEntity[]> {
    return of(this.sshKeys);
  }

  public deleteSSHKey(fingerprint: string): Observable<any> {
    return of(null);
  }

  public createClusterNode(cluster: ClusterEntity, nodeModel: NodeEntity, dc: string, projectID: string): Observable<any> {
    return of(null);
  }

  public createCluster(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    return of(this.cluster);
  }

  public deleteCluster(clusterName: string, dc: string, projectID: string): Observable<any> {
    return of(null);
  }

  public editCluster(cluster: ClusterEntity, dc: string, projectID: string): Observable<ClusterEntity> {
    return of(this.cluster);
  }

  public deleteClusterNode(clusterName: string, nodeName: string, dc: string, projectID: string): Observable<any> {
    return of(null);
  }

  public getClusterNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    return of(this.nodes);
  }

  public getClusterUpgrades(cluster: string): Observable<MasterVersion[]> {
    return of([]);
  }

  public addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    return of(null);
  }

  public getToken(cluster: ClusterEntity, dc: string, projectID: string): Observable<Token> {
    return of(this.token);
  }

  public editToken(cluster: ClusterEntity, dc: string, projectID: string, token: Token): Observable<Token> {
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

  deleteMembers(projectID: string, member: MemberEntity) {
    return of(null);
  }

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    return of(this.vsphereNetworks);
  }
}

export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}
