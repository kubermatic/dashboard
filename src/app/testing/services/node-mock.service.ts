import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/datacenter';
import {NodeDeployment} from '../../shared/entity/node-deployment';
import {NodeSpec} from '../../shared/entity/NodeEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Injectable()
export class NodeMockService {
  createNodes(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {}

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
    cluster: ClusterEntity,
    projectID: string,
    datacenter: DataCenterEntity,
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
