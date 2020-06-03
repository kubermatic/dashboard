import {EventEmitter, Injectable, Injector} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import * as _ from 'lodash';
import {Observable, of} from 'rxjs';
import {catchError, filter, first, flatMap, switchMap} from 'rxjs/operators';

import {ApiService, NotificationService} from '../../core/services';
import {DialogDataInput, DialogDataOutput, NodeDataDialogComponent} from '../../node-data-new/dialog/component';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../shared/entity/NodeDeploymentPatch';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Injectable()
export class NodeService {
  private readonly _notificationService: NotificationService;

  private static _getNodeDeploymentEntity(nodeData: NodeData): NodeDeploymentEntity {
    return {
      name: nodeData.name,
      spec: {
        template: nodeData.spec,
        replicas: nodeData.count,
        dynamicConfig: nodeData.dynamicConfig,
      },
    };
  }

  private static _createPatch(data: DialogDataOutput): NodeDeploymentPatch {
    const patch: NodeDeploymentPatch = {
      spec: {
        replicas: data.nodeData.count,
        template: data.nodeData.spec,
        dynamicConfig: data.nodeData.dynamicConfig,
      },
    };

    // As we are using merge patch to send whole spec we need to ensure that previous values will be unset
    // and replaced by the values from patch. That's why we need to set undefined fields to null.
    // It is not part of API service as it is not required in all cases (i.e. replicas count change).
    patch.spec.template.operatingSystem.ubuntu = patch.spec.template.operatingSystem.ubuntu || null;
    patch.spec.template.operatingSystem.centos = patch.spec.template.operatingSystem.centos || null;
    patch.spec.template.operatingSystem.containerLinux = patch.spec.template.operatingSystem.containerLinux || null;
    patch.spec.template.operatingSystem.flatcar = patch.spec.template.operatingSystem.flatcar || null;
    patch.spec.template.operatingSystem.sles = patch.spec.template.operatingSystem.sles || null;

    return patch;
  }

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialog: MatDialog,
    private readonly _inj: Injector
  ) {
    this._notificationService = this._inj.get(NotificationService);
  }

  createNodeDeployment(
    nodeData: NodeData,
    projectID: string,
    seedDCName: string,
    clusterID: string
  ): Observable<NodeDeploymentEntity> {
    return this._apiService.createNodeDeployment(
      NodeService._getNodeDeploymentEntity(nodeData),
      clusterID,
      seedDCName,
      projectID
    );
  }

  showNodeDeploymentCreateDialog(
    cluster: ClusterEntity,
    projectID: string,
    seedDCName: string,
    existingNodesCount: number
  ): Observable<NodeDeploymentEntity> {
    const dialogRef = this._matDialog.open<NodeDataDialogComponent, DialogDataInput, DialogDataOutput>(
      NodeDataDialogComponent,
      {
        data: {
          initialClusterData: cluster,
        } as DialogDataInput,
      }
    );

    return dialogRef
      .afterClosed()
      .pipe(filter(data => !!data))
      .pipe(switchMap(data => this.createNodeDeployment(data.nodeData, projectID, seedDCName, cluster.id)));
  }

  showNodeDeploymentEditDialog(
    nd: NodeDeploymentEntity,
    cluster: ClusterEntity,
    projectID: string,
    seedDCName: string
  ): Observable<NodeDeploymentEntity> {
    const dialogRef = this._matDialog.open<NodeDataDialogComponent, DialogDataInput, DialogDataOutput>(
      NodeDataDialogComponent,
      {
        data: {
          existingNodesCount: nd.spec.replicas,
          initialClusterData: cluster,
          initialNodeData: {
            count: nd.spec.replicas,
            name: nd.name,
            spec: _.cloneDeep(nd.spec.template),
            dynamicConfig: nd.spec.dynamicConfig,
          } as NodeData,
        },
      }
    );

    return dialogRef
      .afterClosed()
      .pipe(filter(data => !!data))
      .pipe(
        switchMap(data =>
          this._apiService.patchNodeDeployment(NodeService._createPatch(data), nd.id, cluster.id, seedDCName, projectID)
        )
      );
  }

  showNodeDeploymentDeleteDialog(
    nd: NodeDeploymentEntity,
    clusterID: string,
    projectID: string,
    dcName: string,
    changeEventEmitter: EventEmitter<NodeDeploymentEntity>
  ): Observable<boolean> {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Node Deployment',
        message: `Delete "<strong>${nd.name}</strong>" permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    return dialogRef
      .afterClosed()
      .pipe(
        flatMap(
          (isConfirmed: boolean): Observable<boolean> => {
            if (isConfirmed) {
              return this._apiService
                .deleteNodeDeployment(clusterID, nd, dcName, projectID)
                .pipe(first())
                .pipe(
                  catchError(() => {
                    this._notificationService.error('Could not remove the <strong>${nd.name}</strong> node deployment');
                    return of(false);
                  })
                );
            }
            return of(false);
          }
        )
      )
      .pipe(
        flatMap(
          (data: any): Observable<boolean> => {
            if (data) {
              this._notificationService.success(`The <strong>${nd.name}</strong> node deployment was removed`);
              if (changeEventEmitter) {
                changeEventEmitter.emit(nd);
              }
              return of(true);
            }
            return of(false);
          }
        )
      )
      .pipe(first());
  }
}
