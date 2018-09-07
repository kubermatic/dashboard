import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { defer } from 'rxjs/observable/defer';
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
    return Observable.of(this.projects);
  }

  public createProject(): Observable<ProjectEntity> {
    return Observable.of(this.project);
  }

  public deleteProject(projectID: string): Observable<any> {
    return Observable.of(null);
  }

  public getCluster(clusterId: string, dc: string, projectID: string): Observable<ClusterEntity> {
    return Observable.of(this.cluster);
  }

  public getClusters(dc: string, projectID: string): Observable<ClusterEntity[]> {
    return Observable.of(this.clusters);
  }

  public getSSHKeys(): Observable<SSHKeyEntity[]> {
    return Observable.of(this.sshKeys);
  }

  public deleteSSHKey(fingerprint: string): Observable<any> {
    return Observable.of(null);
  }

  public createClusterNode(cluster: ClusterEntity, nodeModel: NodeEntity, dc: string, projectID: string): Observable<any> {
    return Observable.of(null);
  }

  public createCluster(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    return Observable.of(this.cluster);
  }

  public deleteCluster(clusterName: string, dc: string, projectID: string): Observable<any> {
    return Observable.of(null);
  }

  public editCluster(cluster: ClusterEntity, dc: string, projectID: string): Observable<ClusterEntity> {
    return Observable.of(this.cluster);
  }

  public deleteClusterNode(clusterName: string, nodeName: string, dc: string, projectID: string): Observable<any> {
    return Observable.of(null);
  }

  public getClusterNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    return Observable.of(this.nodes);
  }

  public getClusterUpgrades(cluster: string): Observable<MasterVersion[]> {
    return Observable.of([]);
  }

  public addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    return Observable.of(null);
  }

  public getToken(cluster: ClusterEntity, dc: string, projectID: string): Observable<Token> {
    return Observable.of(this.token);
  }

  public editToken(cluster: ClusterEntity, dc: string, projectID: string, token: Token): Observable<Token> {
    return Observable.of(this.token);
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    return Observable.of(this.masterVersions);
  }

  getMembers(projectID: string): Observable<MemberEntity[]> {
    return Observable.of(this.members);
  }

  createMembers(projectID: string, member: CreateMemberEntity): Observable<MemberEntity> {
    return Observable.of(this.member);
  }

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    return Observable.of(this.vsphereNetworks);
  }
}

export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}
