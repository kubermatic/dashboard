import {EventEmitter, Injectable} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {EMPTY, Observable, of} from 'rxjs';
import {catchError, first, flatMap, map} from 'rxjs/operators';

import {ApiService} from '../../core/services';
import {InitialNodeData} from '../../core/services/initial-node-data/initial-nodes-data.service';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../shared/entity/NodeDeploymentPatch';
import {NodeSpec} from '../../shared/entity/NodeEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {NodeDataModalComponent, NodeDataModalData} from '../cluster-details/node-data-modal/node-data-modal.component';

@Injectable()
export class NodeService {
  private static _getNodeDeploymentEntity(nodeData: NodeData): NodeDeploymentEntity {
    return {
      spec: {
        template: nodeData.spec,
        replicas: nodeData.count,
      },
    };
  }

  private static _convertNodeData(initialNodeData: InitialNodeData): NodeData {
    return {
      count: initialNodeData.nodeCount,
      spec: initialNodeData.nodeSpec,
    };
  }

  private static _createPatch(data: NodeDataModalData): NodeDeploymentPatch {
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

  private static _getHealthStatus(color: string, status: string, className: string): object {
    return {
      color,
      status,
      class: className,
    };
  }

  constructor(
      private readonly _apiService: ApiService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _matDialog: MatDialog,
  ) {}

  createInitialNodes(initialNodeData: InitialNodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string):
      void {
    const nodeData = NodeService._convertNodeData(initialNodeData);
    this.createNodeDeployment(nodeData, dc, cluster, project);
  }

  createNodeDeployment(nodeData: NodeData, dc: DataCenterEntity, cluster: ClusterEntity, project: string): void {
    this._apiService
        .createNodeDeployment(cluster, NodeService._getNodeDeploymentEntity(nodeData), dc.metadata.name, project)
        .pipe(first())
        .subscribe(() => {
          NotificationActions.success('Success', 'Node Deployment successfully created');
          this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeAdded');
        });
  }

  getOperatingSystem(spec: NodeSpec): string {
    if (spec.operatingSystem.ubuntu) {
      return 'Ubuntu';
    } else if (spec.operatingSystem.centos) {
      return 'CentOS';
    } else if (spec.operatingSystem.containerLinux) {
      return 'Container Linux';
    } else {
      return '';
    }
  }

  getHealthStatus(nd: NodeDeploymentEntity): object {
    const green = 'fa fa-circle green';
    const orange = 'fa fa-spin fa-circle-o-notch orange';

    if (!nd || !!nd.deletionTimestamp) {
      return NodeService._getHealthStatus(orange, 'Deleting', 'km-status-deleting');
    } else if (!nd.status) {
      return NodeService._getHealthStatus(orange, 'In progress', 'km-status-waiting');
    } else if (nd.status.availableReplicas === nd.spec.replicas) {
      return NodeService._getHealthStatus(green, 'Running', 'km-status-running');
    } else if (nd.status.availableReplicas > nd.spec.replicas) {
      return NodeService._getHealthStatus(orange, 'Updating', 'km-status-waiting');
    } else {
      return NodeService._getHealthStatus(orange, 'In progress', 'km-status-waiting');
    }
  }

  showNodeDeploymentCreateDialog(
      count: number, cluster: ClusterEntity, projectID: string, datacenter: DataCenterEntity): Observable<boolean> {
    const dialogRef = this._matDialog.open(NodeDataModalComponent, {
      data: {
        cluster,
        datacenter,
        projectID,
        existingNodesCount: count,
        editMode: false,
      }
    });

    return dialogRef.afterClosed().pipe<boolean>(map((data: NodeDataModalData) => {
      if (data) {
        this.createNodeDeployment(data.nodeData, data.datacenter, data.cluster, data.projectID);
        return true;
      } else {
        return false;
      }
    }));
  }

  showNodeDeploymentEditDialog(
      nd: NodeDeploymentEntity, cluster: ClusterEntity, projectID: string, datacenter: DataCenterEntity,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): Observable<boolean> {
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

    return dialogRef.afterClosed()
        .pipe(flatMap(
            (data: NodeDataModalData):
                Observable<NodeDeploymentEntity> => {
                  if (data) {
                    return this._apiService
                        .patchNodeDeployment(
                            data.nodeDeployment, NodeService._createPatch(data), data.cluster.id,
                            data.datacenter.metadata.name, data.projectID)
                        .pipe(first())
                        .pipe(catchError(() => {
                          NotificationActions.error('Error', `Could not update Node Deployment`);
                          this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentUpdateFailed');
                          return EMPTY;
                        }));
                  }

                  return EMPTY;
                }))
        .pipe(flatMap(
            (nd: NodeDeploymentEntity):
                Observable<boolean> => {
                  if (nd) {
                    NotificationActions.success('Success', 'Node Deployment updated successfully');
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentUpdated');
                    if (changeEventEmitter) {
                      changeEventEmitter.emit(nd);
                    }

                    return of(true);
                  }

                  return of(false);
                }))
        .pipe(first());
  }

  showNodeDeploymentDeleteDialog(
      nd: NodeDeploymentEntity, clusterID: string, projectID: string, dcName: string,
      changeEventEmitter: EventEmitter<NodeDeploymentEntity>): Observable<boolean> {
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

    return dialogRef.afterClosed()
        .pipe(flatMap(
            (isConfirmed: boolean):
                Observable<boolean> => {
                  if (isConfirmed) {
                    return this._apiService.deleteNodeDeployment(clusterID, nd, dcName, projectID)
                        .pipe(first())
                        .pipe(catchError(() => {
                          NotificationActions.error('Error', `Could not remove Node Deployment`);
                          this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentDeleteFailed');
                          return EMPTY;
                        }));
                  }

                  return EMPTY;
                }))
        .pipe(flatMap(
            (data: any):
                Observable<boolean> => {
                  if (data) {
                    NotificationActions.success('Success', 'Node Deployment removed successfully');
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentDeleted');
                    if (changeEventEmitter) {
                      changeEventEmitter.emit(nd);
                    }

                    return of(true);
                  }

                  return of(false);
                }))
        .pipe(first());
  }
}
