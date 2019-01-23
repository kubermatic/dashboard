import {EventEmitter, Injectable} from '@angular/core';

import {InitialNodeData} from '../../core/services/initial-node-data/initial-nodes-data.service';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeSpec} from '../../shared/entity/NodeEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';


@Injectable()
export class NodeMockService {
  createInitialNodes(initialNodeData: InitialNodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {}

  createNodes(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {}

  getOperatingSystem(spec: NodeSpec): string {
    return 'ubuntu';
  }

  getHealthStatus(nd: NodeDeploymentEntity): object {
    return {
      color: 'fa fa-spin fa-circle-o-notch orange',
      status: 'In progress',
      class: 'km-status-waiting',
    };
  }

  showNodeDeploymentEditDialog(
      nd: NodeDeploymentEntity, cluster: ClusterEntity, projectID: string, datacenter: DataCenterEntity,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): Promise<boolean> {
    return new Promise((resolve => {
      resolve(true);
    }));
  }

  showNodeDeploymentDeleteDialog(
      nd: NodeDeploymentEntity, clusterID: string, projectID: string, dcName: string,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): Promise<boolean> {
    return new Promise((resolve => {
      resolve(true);
    }));
  }
}
