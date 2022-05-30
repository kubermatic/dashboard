// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {EventEmitter, Injectable, Injector} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {DialogDataInput, DialogDataOutput, NodeDataDialogComponent} from '@app/node-data/dialog/component';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {MachineDeployment, MachineDeploymentPatch} from '@shared/entity/machine-deployment';
import {NodeData} from '@shared/model/NodeSpecChange';
import {Observable, of} from 'rxjs';
import {catchError, filter, mergeMap, switchMap, take} from 'rxjs/operators';
import {MachineDeploymentService} from '@core/services/machine-deployment';

@Injectable()
export class NodeService {
  private readonly _notificationService: NotificationService;

  private static _getMachineDeploymentEntity(nodeData: NodeData): MachineDeployment {
    return {
      name: nodeData.name,
      spec: {
        template: nodeData.spec,
        replicas: nodeData.count,
        dynamicConfig: nodeData.dynamicConfig,
      },
    };
  }

  private static _createPatch(data: DialogDataOutput): MachineDeploymentPatch {
    const patch: MachineDeploymentPatch = {
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
    patch.spec.template.operatingSystem.flatcar = patch.spec.template.operatingSystem.flatcar || null;
    patch.spec.template.operatingSystem.sles = patch.spec.template.operatingSystem.sles || null;

    return patch;
  }

  constructor(
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _matDialog: MatDialog,
    private readonly _inj: Injector
  ) {
    this._notificationService = this._inj.get(NotificationService);
  }

  createMachineDeployment(nodeData: NodeData, projectID: string, clusterID: string): Observable<MachineDeployment> {
    return this._machineDeploymentService.create(
      NodeService._getMachineDeploymentEntity(nodeData),
      clusterID,
      projectID
    );
  }

  showMachineDeploymentCreateDialog(cluster: Cluster, projectID: string): Observable<MachineDeployment> {
    return this._matDialog
      .open<NodeDataDialogComponent, DialogDataInput, DialogDataOutput>(NodeDataDialogComponent, {
        data: {initialClusterData: cluster} as DialogDataInput,
      })
      .afterClosed()
      .pipe(
        filter(data => !!data),
        switchMap(data => this.createMachineDeployment(data.nodeData, projectID, cluster.id))
      );
  }

  showMachineDeploymentEditDialog(
    md: MachineDeployment,
    cluster: Cluster,
    projectID: string
  ): Observable<MachineDeployment> {
    const dialogRef = this._matDialog.open(NodeDataDialogComponent, {
      data: {
        initialClusterData: cluster,
        initialNodeData: {
          count: md.spec.replicas,
          name: md.name,
          spec: md.spec.template,
          dynamicConfig: md.spec.dynamicConfig,
        } as NodeData,
      },
    });

    return dialogRef.afterClosed().pipe(
      filter(data => !!data),
      switchMap(data =>
        this._machineDeploymentService.patch(NodeService._createPatch(data), md.id, cluster.id, projectID)
      )
    );
  }

  showMachineDeploymentDeleteDialog(
    md: MachineDeployment,
    cluster: Cluster,
    projectID: string,
    changeEventEmitter: EventEmitter<MachineDeployment>
  ): Observable<boolean> {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Machine Deployment',
        message: `Delete <b>${md.name}</b> machine deployment of <b>${cluster.name}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };

    return this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(
        mergeMap((isConfirmed: boolean): Observable<boolean | void> => {
          if (isConfirmed) {
            return this._machineDeploymentService.delete(cluster.id, md, projectID).pipe(
              catchError(() => {
                this._notificationService.error(`Could not delete the ${md.name} machine deployment`);
                return of(false);
              }),
              take(1)
            );
          }
          return of(false);
        })
      )
      .pipe(
        mergeMap((data: boolean): Observable<boolean> => {
          if (data) {
            this._notificationService.success(`Deleting the ${md.name} machine deployment`);
            changeEventEmitter?.emit(md);
            return of(true);
          }
          return of(false);
        }),
        take(1)
      );
  }

  showMachineDeploymentRestartDialog(
    md: MachineDeployment,
    cluster: Cluster,
    projectID: string,
    changeEventEmitter: EventEmitter<MachineDeployment> = undefined
  ): Observable<boolean> {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Restart Machine Deployment',
        message: `Perform rolling restart of <b>${md.name}</b> machine deployment of <b>${cluster.name}</b> cluster?`,
        confirmLabel: 'Restart',
      },
    };

    return this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(
        mergeMap((isConfirmed: boolean): Observable<MachineDeployment | boolean> => {
          if (isConfirmed) {
            return this._machineDeploymentService.restart(cluster.id, md, projectID).pipe(
              catchError(() => {
                this._notificationService.error(`Could not restart the ${md.name} machine deployment`);
                return of(false);
              }),
              take(1)
            );
          }
          return of(false);
        }),
        mergeMap((data: boolean): Observable<boolean> => {
          if (data) {
            this._notificationService.success(`Restarting the ${md.name} machine deployment`);
            changeEventEmitter?.emit(md);
            return of(true);
          }
          return of(false);
        }),
        take(1)
      );
  }
}
