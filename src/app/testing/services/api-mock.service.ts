import { nodesFake } from './../fake-data/node.fake';
import { NodeEntity } from '../../shared/entity/NodeEntity';
import { fakeSSHKeys } from './../fake-data/sshkey.fake';
import { fakeClusters, fakeDigitaloceanCluster } from './../fake-data/cluster.fake';
import { masterVersionsFake } from './../fake-data/cluster-spec.fake';
import { ClusterEntity, MasterVersion } from './../../shared/entity/ClusterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { defer } from 'rxjs/observable/defer';

@Injectable()
export class ApiMockService {
  public cluster: ClusterEntity = fakeDigitaloceanCluster();
  public clusters: ClusterEntity[] = fakeClusters();
  public sshKeys: SSHKeyEntity[] = fakeSSHKeys();
  public nodes: NodeEntity[] = nodesFake();
  public masterVersions: MasterVersion[] = masterVersionsFake();

  constructor() {
  }

  public getCluster(clusterId: string, dc: string): Observable<ClusterEntity> {
    return Observable.of(this.cluster);
  }

  public getClusters(dc: string): Observable<ClusterEntity[]> {
    return Observable.of(this.clusters);
  }

  public getSSHKeys(): Observable<SSHKeyEntity[]> {
    return Observable.of(this.sshKeys);
  }

  public deleteSSHKey(fingerprint: string): Observable<any> {
    return Observable.of(null);
  }

  public createClusterNode(cluster: ClusterEntity, nodeModel: NodeEntity, dc: string): Observable<any> {
    return Observable.of(null);
  }

  public createCluster(createClusterModel: CreateClusterModel, dc: string): Observable<ClusterEntity> {
    return Observable.of(this.cluster);
  }

  public deleteCluster(clusterName: string, dc: string): Observable<any> {
    return Observable.of(null);
  }

  public editCluster(cluster: ClusterEntity, dc: string): Observable<ClusterEntity> {
    return Observable.of(this.cluster);
  }

  public deleteClusterNode(clusterName: string, nodeName: string, dc: string): Observable<any> {
    return Observable.of(null);
  }

  public getClusterNodes(cluster: string, dc: string): Observable<NodeEntity[]> {
    return Observable.of(this.nodes);
  }

  public getClusterUpgrades(cluster: string): Observable<MasterVersion[]> {
    return Observable.of([]);
  }

  public addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    return Observable.of(null);
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    return Observable.of(this.masterVersions);
  }
}

export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}
