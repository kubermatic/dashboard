import {Injectable} from '@angular/core';
import {defer, Observable, of} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';
import {ClusterEntity, MasterVersion, Token} from '../../shared/entity/ClusterEntity';
import {CreateMemberEntity, MemberEntity} from '../../shared/entity/MemberEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {EditProjectEntity, ProjectEntity} from '../../shared/entity/ProjectEntity';
import {VSphereNetwork} from '../../shared/entity/provider/vsphere/VSphereEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {CreateClusterModel} from '../../shared/model/CreateClusterModel';
import {masterVersionsFake} from '../fake-data/cluster-spec.fake';
import {fakeClusters, fakeDigitaloceanCluster, fakeToken} from '../fake-data/cluster.fake';
import {fakeMember, fakeMembers} from '../fake-data/member.fake';
import {nodesFake} from '../fake-data/node.fake';
import {fakeProject, fakeProjects} from '../fake-data/project.fake';
import {fakeSSHKeys} from '../fake-data/sshkey.fake';
import {fakeVSphereNetworks} from '../fake-data/vsphere.fake';

@Injectable()
export class ApiMockService {
  cluster: ClusterEntity = fakeDigitaloceanCluster();
  clusters: ClusterEntity[] = fakeClusters();
  project: ProjectEntity = fakeProject();
  projects: ProjectEntity[] = fakeProjects();
  sshKeys: SSHKeyEntity[] = fakeSSHKeys();
  nodes: NodeEntity[] = nodesFake();
  masterVersions: MasterVersion[] = masterVersionsFake();
  token: Token = fakeToken();
  member: MemberEntity = fakeMember();
  members: MemberEntity[] = fakeMembers();
  vsphereNetworks: VSphereNetwork[] = fakeVSphereNetworks();

  constructor() {}

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

  getCluster(clusterId: string, dc: string, projectID: string): Observable<ClusterEntity> {
    return of(this.cluster);
  }

  getClusters(dc: string, projectID: string): Observable<ClusterEntity[]> {
    return of(this.clusters);
  }

  getSSHKeys(): Observable<SSHKeyEntity[]> {
    return of(this.sshKeys);
  }

  deleteSSHKey(fingerprint: string): Observable<any> {
    return of(null);
  }

  createClusterNode(cluster: ClusterEntity, nodeModel: NodeEntity, dc: string, projectID: string): Observable<any> {
    return of(null);
  }

  createCluster(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    return of(this.cluster);
  }

  deleteCluster(clusterName: string, dc: string, projectID: string): Observable<any> {
    return of(null);
  }

  editCluster(cluster: ClusterEntity, dc: string, projectID: string): Observable<ClusterEntity> {
    return of(this.cluster);
  }

  deleteClusterNode(clusterName: string, nodeName: string, dc: string, projectID: string): Observable<any> {
    return of(null);
  }

  getClusterNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    return of(this.nodes);
  }

  getClusterUpgrades(cluster: string): Observable<MasterVersion[]> {
    return of([]);
  }

  getClusterNodeUpgrades(cluster: string): Observable<MasterVersion[]> {
    return of([]);
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

  getVSphereNetworks(username: string, password: string, datacenterName: string): Observable<VSphereNetwork[]> {
    return of(this.vsphereNetworks);
  }
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
