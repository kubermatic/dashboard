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
      color: 'km-icon-mask km-icon-circle km-warning-bg',
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
