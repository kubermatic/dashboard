import {Injectable} from '@angular/core';

import {InitialNodeData} from '../../core/services/initial-node-data/initial-nodes-data.service';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';


@Injectable()
export class NodeMockService {
  createInitialNodes(initialNodeData: InitialNodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {}

  createNodes(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {}
}
