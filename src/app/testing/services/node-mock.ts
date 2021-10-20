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

import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';

@Injectable()
export class NodeMockService {
  createNodes(_nodeData: NodeData, _dc: Datacenter, _cluster: Cluster, _project: string): void {}

  getOperatingSystem(_spec: NodeSpec): string {
    return 'ubuntu';
  }

  getHealthStatus(_md: MachineDeployment): object {
    return {
      color: 'km-icon-mask km-icon-circle km-warning-bg',
      status: 'In progress',
      class: 'km-status-waiting',
    };
  }

  showMachineDeploymentEditDialog(
    _md: MachineDeployment,
    _cluster: Cluster,
    _projectID: string,
    _datacenter: Datacenter,
    _changeEventEmitter: EventEmitter<MachineDeployment>
  ): Observable<boolean> {
    return of(true);
  }

  showMachineDeploymentDeleteDialog(
    _md: MachineDeployment,
    _clusterID: string,
    _projectID: string,
    _dcName: string,
    _changeEventEmitter: EventEmitter<MachineDeployment>
  ): Observable<boolean> {
    return of(true);
  }
}
