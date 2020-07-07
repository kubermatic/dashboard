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

import {Injectable} from '@angular/core';
import {defer, Observable, of, Subject} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';

import {Addon} from '../../shared/entity/addon';
import {Cluster, ClusterPatch, MasterVersion, ProviderSettingsPatch} from '../../shared/entity/cluster';
import {Event} from '../../shared/entity/event';
import {Health} from '../../shared/entity/health';
import {ClusterMetrics} from '../../shared/entity/metrics';
import {Node} from '../../shared/entity/node';
import {SSHKey} from '../../shared/entity/ssh-key';
import {CreateClusterModel} from '../../shared/model/CreateClusterModel';
import {fakeClusters, fakeDigitaloceanCluster} from '../fake-data/cluster.fake';
import {fakeEvents} from '../fake-data/event.fake';
import {fakeHealth} from '../fake-data/health.fake';
import {nodesFake} from '../fake-data/node.fake';
import {fakeSSHKeys} from '../fake-data/sshkey.fake';

@Injectable()
export class ClusterMockService {
  private _cluster: Cluster = fakeDigitaloceanCluster();
  private _clusters: Cluster[] = fakeClusters();
  private _sshKeys: SSHKey[] = fakeSSHKeys();
  private _nodes: Node[] = nodesFake();
  private _health: Health = fakeHealth();

  providerSettingsPatchChanges$ = new Subject<ProviderSettingsPatch>().asObservable();

  changeProviderSettingsPatch(): void {}

  cluster(clusterId: string, dc: string, projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  clusters(projectID: string): Observable<Cluster[]> {
    return asyncData(this._clusters);
  }

  health(cluster: string, dc: string, projectID: string): Observable<Health> {
    return asyncData(this._health);
  }

  sshKeys(): Observable<SSHKey[]> {
    return asyncData(this._sshKeys);
  }

  deleteSSHKey(fingerprint: string): Observable<any> {
    return asyncData(null);
  }

  create(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  delete(clusterName: string, dc: string, projectID: string): Observable<any> {
    return asyncData(null);
  }

  edit(cluster: Cluster, dc: string, projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  patch(projectID: string, clusterID: string, datacenter: string, patch: ClusterPatch): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  deleteNode(clusterName: string, nodeName: string, dc: string, projectID: string): Observable<any> {
    return asyncData(null);
  }

  getNodes(cluster: string, dc: string, projectID: string): Observable<Node[]> {
    return asyncData(this._nodes);
  }

  upgrades(cluster: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  nodes(projectID: string, clusterID: string, datacenter: string): Observable<Node[]> {
    return asyncData(nodesFake());
  }

  metrics(projectID: string, clusterID: string, datacenter: string): Observable<ClusterMetrics> {
    return asyncData(null);
  }

  nodeUpgrades(controlPlaneVersion: string, type: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  upgradeMachineDeployments(): Observable<any[]> {
    return of([]);
  }

  createSSHKey(sshKey: SSHKey): Observable<SSHKey> {
    return of(null);
  }

  events(projectID: string, clusterID: string, datacenter: string): Observable<Event[]> {
    return of(fakeEvents());
  }

  addons(projectID: string, cluster: string, dc: string): Observable<Addon[]> {
    return of([]);
  }

  refreshClusters(): void {}
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
