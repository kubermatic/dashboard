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
import {Addon} from '@shared/entity/addon';
import {
  Cluster,
  ClusterPatch,
  CNIPluginVersions,
  CreateClusterModel,
  MasterVersion,
  ProviderSettingsPatch,
} from '@shared/entity/cluster';
import {Event} from '@shared/entity/event';
import {Health} from '@shared/entity/health';
import {ClusterMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {SSHKey} from '@shared/entity/ssh-key';
import {defer, Observable, of, Subject} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';
import {fakeClusters, fakeDigitaloceanCluster} from '../fake-data/cluster';
import {fakeEvents} from '../fake-data/event';
import {fakeHealth} from '../fake-data/health';
import {nodesFake} from '../fake-data/node';
import {fakeSSHKeys} from '../fake-data/sshkey';

@Injectable()
export class ClusterMockService {
  private _cluster: Cluster = fakeDigitaloceanCluster();
  private _clusters: Cluster[] = fakeClusters();
  private _sshKeys: SSHKey[] = fakeSSHKeys();
  private _nodes: Node[] = nodesFake();
  private _health: Health = fakeHealth();

  providerSettingsPatchChanges$ = new Subject<ProviderSettingsPatch>().asObservable();

  changeProviderSettingsPatch(): void {}

  cluster(_clusterId: string, _dc: string, _projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  clusters(_projectID: string): Observable<Cluster[]> {
    return asyncData(this._clusters);
  }

  health(_cluster: string, _dc: string, _projectID: string): Observable<Health> {
    return asyncData(this._health);
  }

  sshKeys(): Observable<SSHKey[]> {
    return asyncData(this._sshKeys);
  }

  deleteSSHKey(_fingerprint: string): Observable<any> {
    return asyncData(null);
  }

  create(_createClusterModel: CreateClusterModel, _dc: string, _projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  delete(_clusterName: string, _dc: string, _projectID: string): Observable<any> {
    return asyncData(null);
  }

  edit(_cluster: Cluster, _dc: string, _projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  patch(_projectID: string, _clusterId: string, _datacenter: string, _patch: ClusterPatch): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  deleteNode(_clusterName: string, _nodeName: string, _dc: string, _projectID: string): Observable<any> {
    return asyncData(null);
  }

  getNodes(_cluster: string, _dc: string, _projectID: string): Observable<Node[]> {
    return asyncData(this._nodes);
  }

  upgrades(_cluster: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  cniVersions(_projectID: string, _clusterID: string): Observable<CNIPluginVersions> {
    return asyncData(null);
  }

  nodes(_projectID: string, _clusterId: string, _datacenter: string): Observable<Node[]> {
    return asyncData(nodesFake());
  }

  metrics(_projectID: string, _clusterId: string, _datacenter: string): Observable<ClusterMetrics> {
    return asyncData(null);
  }

  nodeUpgrades(_controlPlaneVersion: string, _type: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  upgradeMachineDeployments(): Observable<any[]> {
    return of([]);
  }

  createSSHKey(_sshKey: SSHKey): Observable<SSHKey> {
    return of(null);
  }

  events(_projectID: string, _clusterId: string, _datacenter: string): Observable<Event[]> {
    return of(fakeEvents());
  }

  addons(_projectID: string, _cluster: string, _dc: string): Observable<Addon[]> {
    return of([]);
  }

  refreshClusters(): void {}
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
