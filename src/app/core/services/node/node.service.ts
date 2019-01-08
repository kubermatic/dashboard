import {Injectable} from '@angular/core';
import {combineLatest, ObservableInput} from 'rxjs';
import {ApiService} from '..';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {NodeData} from '../../../shared/model/NodeSpecChange';
import {InitialNodeData} from '../initial-node-data/initial-nodes-data.service';

@Injectable()
export class NodeService {
  private static getNodeDeploymentEntity_(nodeData: NodeData): NodeDeploymentEntity {
    return {
      spec: {
        template: nodeData.spec,
        replicas: nodeData.count,
      },
    };
  }

  private static getNodeEntity_(nodeData: NodeData): NodeEntity {
    return {
      spec: nodeData.spec,
    };
  }

  private static convertNodeData(initialNodeData: InitialNodeData): NodeData {
    return {
      count: initialNodeData.nodeCount,
      spec: initialNodeData.nodeSpec,
    };
  }

  constructor(private readonly api_: ApiService, private readonly gas_: GoogleAnalyticsService) {}

  createInitialNodes(initialNodeData: InitialNodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {
    const nodeData = NodeService.convertNodeData(initialNodeData);
    this.createNodes(nodeData, dc, cluster, project);
  }

  createNodes(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {
    if (this.api_.isNodeDeploymentAPIAvailable()) {
      this.createNodeDeployment_(nodeData, dc, cluster, project);
    } else {
      this.createNodes_(nodeData, dc, cluster, project);
    }
  }

  private createNodeDeployment_(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {
    const createObservables: Array<ObservableInput<any>> = [];
    createObservables.push(this.api_.createNodeDeployment(
        cluster, NodeService.getNodeDeploymentEntity_(nodeData), dc.metadata.name, project));
    this.observeCreation_(createObservables, 'Node Deployment successfully created');
  }

  private createNodes_(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {
    const createObservables: Array<ObservableInput<any>> = [];
    for (let i = 0; i < nodeData.count; i++) {
      createObservables.push(
          this.api_.createClusterNode(cluster, NodeService.getNodeEntity_(nodeData), dc.metadata.name, project));
    }
    this.observeCreation_(createObservables, 'Node successfully created');
  }

  private observeCreation_(createObservables: Array<ObservableInput<any>>, successMessage: string): void {
    combineLatest(createObservables).toPromise().then(() => {
      NotificationActions.success('Success', successMessage);
      this.gas_.emitEvent('clusterOverview', 'nodeAdded');
    });
  }
}
