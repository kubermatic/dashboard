import { Injectable } from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { NodeSpec } from '../../../shared/entity/NodeEntity';

class InitialNodeData {
  cluster: string;
  nodeCount: number;
  nodeSpec: NodeSpec;
}

@Injectable()
export class InitialNodeDataService {
  constructor() {}

  public storeInitialNodeData(nodeCount: number, cluster: ClusterEntity, nodeSpec: NodeSpec): void {
    const data: InitialNodeData = {
      nodeCount,
      nodeSpec,
      cluster: cluster.id,
    };
    localStorage.setItem(`${cluster.id}_initialNodeData`, JSON.stringify(data));
  }

  public clearInitialNodeData(cluster: ClusterEntity): void {
    localStorage.removeItem(`${cluster.id}_initialNodeData`);
  }

  public getInitialNodeData(cluster: ClusterEntity): InitialNodeData | null {
    const sdata = localStorage.getItem(`${cluster.id}_initialNodeData`);
    if (sdata == null) {
      return null;
    }
    return JSON.parse(sdata);
  }
}
