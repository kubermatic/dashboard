import {EventEmitter, Injectable} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {combineLatest, ObservableInput} from 'rxjs';
import {first} from 'rxjs/operators';

import {ApiService} from '..';
import {NodeDataModalComponent} from '../../../cluster/cluster-details/node-data-modal/node-data-modal.component';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
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

  constructor(
      private readonly _apiService: ApiService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _matDialog: MatDialog,
  ) {}

  createInitialNodes(initialNodeData: InitialNodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {
    const nodeData = NodeService.convertNodeData(initialNodeData);
    this.createNodes(nodeData, dc, cluster, project);
  }

  createNodes(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {
    if (this._apiService.isNodeDeploymentEnabled()) {
      this.createNodeDeployment_(nodeData, dc, cluster, project);
    } else {
      this.createNodes_(nodeData, dc, cluster, project);
    }
  }

  private createNodeDeployment_(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {
    const createObservables: Array<ObservableInput<any>> = [];
    createObservables.push(this._apiService.createNodeDeployment(
        cluster, NodeService.getNodeDeploymentEntity_(nodeData), dc.metadata.name, project));
    this.observeCreation_(createObservables, 'Node Deployment successfully created');
  }

  private createNodes_(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {
    const createObservables: Array<ObservableInput<any>> = [];
    for (let i = 0; i < nodeData.count; i++) {
      createObservables.push(
          this._apiService.createClusterNode(cluster, NodeService.getNodeEntity_(nodeData), dc.metadata.name, project));
    }
    this.observeCreation_(createObservables, 'Node successfully created');
  }

  private observeCreation_(createObservables: Array<ObservableInput<any>>, successMessage: string): void {
    combineLatest(createObservables).toPromise().then(() => {
      NotificationActions.success('Success', successMessage);
      this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeAdded');
    });
  }

  showNodeDeploymentEditDialog(
      nd: NodeDeploymentEntity, cluster: ClusterEntity, projectID: string, datacenter: DataCenterEntity,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>) {
    const dialogRef = this._matDialog.open(NodeDataModalComponent, {
      data: {
        cluster,
        datacenter,
        projectID,
        existingNodesCount: nd.spec.replicas,
        editMode: true,
        nodeDeployment: nd,
        nodeData: {
          count: nd.spec.replicas,
          spec: JSON.parse(JSON.stringify(nd.spec.template)),  // Deep copy method from MDN.
          valid: true,
        },
      }
    });

    dialogRef.componentInstance.editNodeDeployment.pipe(first()).subscribe((nd) => {
      if (changeEventEmitter) {
        changeEventEmitter.emit(nd);
      }
    });
  }

  showNodeDeploymentDeleteDialog(
      nd: NodeDeploymentEntity, clusterID: string, projectID: string, dcName: string,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Node Deployment',
        message: `You are on the way to delete the ${nd.name} node deployment. It cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService.deleteNodeDeployment(clusterID, nd, dcName, projectID).subscribe(() => {
          NotificationActions.success('Success', 'Node Deployment removed successfully');
          this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentDeleted');
          if (changeEventEmitter) {
            changeEventEmitter.emit(nd);
          }
        });
      }
    });
  }
}
