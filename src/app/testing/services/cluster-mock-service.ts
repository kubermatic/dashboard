import {Injectable} from '@angular/core';
import {defer, Observable, of, Subject} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';
import {ProviderSettingsPatch} from '../../core/services/cluster/cluster.service';

import {ClusterEntity, MasterVersion} from '../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../shared/entity/ClusterEntityPatch';
import {EventEntity} from '../../shared/entity/EventEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {CreateClusterModel} from '../../shared/model/CreateClusterModel';
import {fakeClusters, fakeDigitaloceanCluster} from '../fake-data/cluster.fake';
import {fakeEvents} from '../fake-data/event.fake';
import {fakeHealth} from '../fake-data/health.fake';
import {nodesFake} from '../fake-data/node.fake';
import {fakeSSHKeys} from '../fake-data/sshkey.fake';

@Injectable()
export class ClusterMockService {
  private _cluster: ClusterEntity = fakeDigitaloceanCluster();
  private _clusters: ClusterEntity[] = fakeClusters();
  private _sshKeys: SSHKeyEntity[] = fakeSSHKeys();
  private _nodes: NodeEntity[] = nodesFake();
  private _health: HealthEntity = fakeHealth();

  providerSettingsPatchChanges$ = new Subject<ProviderSettingsPatch>().asObservable();

  changeProviderSettingsPatch() {}

  cluster(clusterId: string, dc: string, projectID: string): Observable<ClusterEntity> {
    return asyncData(this._cluster);
  }

  clusters(projectID: string): Observable<ClusterEntity[]> {
    return asyncData(this._clusters);
  }

  health(cluster: string, dc: string, projectID: string): Observable<HealthEntity> {
    return asyncData(this._health);
  }

  sshKeys(): Observable<SSHKeyEntity[]> {
    return asyncData(this._sshKeys);
  }

  deleteSSHKey(fingerprint: string): Observable<any> {
    return asyncData(null);
  }

  createNode(cluster: ClusterEntity, nodeModel: NodeEntity, dc: string, projectID: string): Observable<any> {
    return asyncData(null);
  }

  create(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    return asyncData(this._cluster);
  }

  delete(clusterName: string, dc: string, projectID: string): Observable<any> {
    return asyncData(null);
  }

  edit(cluster: ClusterEntity, dc: string, projectID: string): Observable<ClusterEntity> {
    return asyncData(this._cluster);
  }

  patch(projectID: string, clusterID: string, datacenter: string, patch: ClusterEntityPatch) {
    return asyncData(this._cluster);
  }

  deleteNode(clusterName: string, nodeName: string, dc: string, projectID: string): Observable<any> {
    return asyncData(null);
  }

  getNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    return asyncData(this._nodes);
  }

  upgrades(cluster: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  nodes(projectID: string, clusterID: string, datacenter: string) {
    return asyncData(nodesFake());
  }

  nodeUpgrades(controlPlaneVersion: string, type: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  upgradeNodeDeployments() {
    return of([]);
  }

  createSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    return of(null);
  }

  events(projectID: string, clusterID: string, datacenter: string): Observable<EventEntity[]> {
    return of(fakeEvents());
  }

  refreshClusters() {}
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
