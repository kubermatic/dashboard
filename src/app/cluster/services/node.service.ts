import {EventEmitter, Injectable} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {combineLatest, ObservableInput} from 'rxjs';
import {first} from 'rxjs/operators';

import {ApiService} from '../../core/services';
import {InitialNodeData} from '../../core/services/initial-node-data/initial-nodes-data.service';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../shared/entity/NodeDeploymentPatch';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {NodeDataModalComponent, NodeDataModalData} from '../cluster-details/node-data-modal/node-data-modal.component';

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

  private static convertNodeData(initialNodeData: InitialNodeData): NodeData {
    return {
      count: initialNodeData.nodeCount,
      spec: initialNodeData.nodeSpec,
    };
  }

  private static createPatch(data: NodeDataModalData): NodeDeploymentPatch {
    const patch: NodeDeploymentPatch = {
      spec: {
        replicas: data.nodeData.count,
        template: data.nodeData.spec,
      },
    };

    // As we are using merge patch to send whole spec we need to ensure that previous values will be unset
    // and replaced by the values from patch. That's why we need to set undefined fields to null.
    // It is not part of API service as it is not required in all cases (i.e. replicas count change).
    patch.spec.template.operatingSystem.ubuntu = patch.spec.template.operatingSystem.ubuntu || null;
    patch.spec.template.operatingSystem.centos = patch.spec.template.operatingSystem.centos || null;
    patch.spec.template.operatingSystem.containerLinux = patch.spec.template.operatingSystem.containerLinux || null;

    return patch;
  }

  constructor(
      private readonly _apiService: ApiService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _matDialog: MatDialog,
  ) {}

  createInitialNodes(initialNodeData: InitialNodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {
    const nodeData = NodeService.convertNodeData(initialNodeData);
    this.createNodeDeployment(nodeData, dc, cluster, project);
  }

  createNodeDeployment(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {
    const createObservables: Array<ObservableInput<any>> = [];
    createObservables.push(this._apiService.createNodeDeployment(
        cluster, NodeService.getNodeDeploymentEntity_(nodeData), dc.metadata.name, project));
    this.observeCreation_(createObservables, 'Node Deployment successfully created');
  }

  private observeCreation_(createObservables: Array<ObservableInput<any>>, successMessage: string): void {
    combineLatest(createObservables).toPromise().then(() => {
      NotificationActions.success('Success', successMessage);
      this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeAdded');
    });
  }

  showNodeDeploymentCreateDialog(
      count: number, cluster: ClusterEntity, projectID: string, datacenter: DataCenterEntity): Promise<boolean> {
    const modal = this._matDialog.open(NodeDataModalComponent, {
      data: {
        cluster,
        datacenter,
        projectID,
        existingNodesCount: count,
        editMode: false,
      }
    });

    return new Promise(resolve => {
      modal.afterClosed().subscribe((data: NodeDataModalData) => {
        if (data) {
          this.createNodeDeployment(data.nodeData, data.datacenter, data.cluster, data.projectID);
          resolve(true);
        }
        resolve(false);
      });
    });
  }

  showNodeDeploymentEditDialog(
      nd: NodeDeploymentEntity, cluster: ClusterEntity, projectID: string, datacenter: DataCenterEntity,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): Promise<boolean> {
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

    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe((data: NodeDataModalData) => {
        if (data) {
          this._apiService
              .patchNodeDeployment(
                  data.nodeDeployment, NodeService.createPatch(data), data.cluster.id, data.datacenter.metadata.name,
                  data.projectID)
              .toPromise()
              .then(
                  (nd) => {
                    NotificationActions.success('Success', 'Node Deployment updated successfully');
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentUpdated');
                    if (changeEventEmitter) {
                      changeEventEmitter.emit(nd);
                    }
                    resolve(true);
                  },
                  (error) => {
                    NotificationActions.error('Error', `Could not update Node Deployment`);
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentUpdateFailed');
                    reject(error);
                  });
        }
        resolve(false);
      });
    });
  }

  showNodeDeploymentDeleteDialog(
      nd: NodeDeploymentEntity, clusterID: string, projectID: string, dcName: string,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): Promise<boolean> {
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

    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this._apiService.deleteNodeDeployment(clusterID, nd, dcName, projectID)
              .subscribe(
                  () => {
                    NotificationActions.success('Success', 'Node Deployment removed successfully');
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentDeleted');
                    if (changeEventEmitter) {
                      changeEventEmitter.emit(nd);
                    }
                    resolve(true);
                  },
                  (error) => {
                    NotificationActions.error('Error', `Could not remove Node Deployment`);
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentDeleteFailed');
                    reject(error);
                  });
        }
        resolve(false);
      });
    });
  }
}
