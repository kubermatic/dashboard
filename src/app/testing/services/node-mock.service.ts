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

import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {Cluster} from '../../shared/entity/cluster';
import {Datacenter} from '../../shared/entity/datacenter';
import {NodeDeployment} from '../../shared/entity/node-deployment';
import {NodeSpec} from '../../shared/entity/node';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Injectable()
export class NodeMockService {
  createNodes(nodeData: NodeData, dc: Datacenter, cluster: Cluster, project: string): void {}

  getOperatingSystem(spec: NodeSpec): string {
    return 'ubuntu';
  }

  getHealthStatus(nd: NodeDeployment): object {
    return {
      color: 'fa fa-circle orange',
      status: 'In progress',
      class: 'km-status-waiting',
    };
  }

  showNodeDeploymentEditDialog(
    nd: NodeDeployment,
    cluster: Cluster,
    projectID: string,
    datacenter: Datacenter,
    changeEventEmitter: EventEmitter<NodeDeployment>
  ): Observable<boolean> {
    return of(true);
  }

  showNodeDeploymentDeleteDialog(
    nd: NodeDeployment,
    clusterID: string,
    projectID: string,
    dcName: string,
    changeEventEmitter: EventEmitter<NodeDeployment>
  ): Observable<boolean> {
    return of(true);
  }
}
