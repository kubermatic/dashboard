// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {EventEmitter, Injectable, Injector} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import * as _ from 'lodash';
import {Observable, of} from 'rxjs';
import {catchError, first, flatMap, map} from 'rxjs/operators';

import {NotificationService} from '../../core/services';
import {ApiService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '../../shared/entity/cluster';
import {Datacenter} from '../../shared/entity/datacenter';
import {MachineDeployment, MachineDeploymentPatch} from '../../shared/entity/machine-deployment';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {NodeDataModalComponent, NodeDataModalData} from '../cluster-details/node-data-modal/node-data-modal.component';

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

  private static _createPatch(data: NodeDataModalData): MachineDeploymentPatch {
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
    patch.spec.template.operatingSystem.containerLinux = patch.spec.template.operatingSystem.containerLinux || null;
    patch.spec.template.operatingSystem.flatcar = patch.spec.template.operatingSystem.flatcar || null;
    patch.spec.template.operatingSystem.sles = patch.spec.template.operatingSystem.sles || null;

    return patch;
  }

  constructor(
    private readonly _apiService: ApiService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _matDialog: MatDialog,
    private readonly _inj: Injector
  ) {
    this._notificationService = this._inj.get(NotificationService);
  }

  createMachineDeployment(nodeData: NodeData, dc: Datacenter, cluster: Cluster, project: string): void {
    this._apiService
      .createMachineDeployment(cluster, NodeService._getMachineDeploymentEntity(nodeData), dc.metadata.name, project)
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `A new machine deployment was created in the <strong>${cluster.name}</strong> cluster`
        );
        this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeAdded');
      });
  }

  showMachineDeploymentCreateDialog(
    count: number,
    cluster: Cluster,
    projectID: string,
    datacenter: Datacenter
  ): Observable<boolean> {
    const dialogRef = this._matDialog.open(NodeDataModalComponent, {
      data: {
        cluster,
        datacenter,
        projectID,
        existingNodesCount: count,
        editMode: false,
      },
    });

    return dialogRef.afterClosed().pipe<boolean>(
      map((data: NodeDataModalData) => {
        if (data) {
          this.createMachineDeployment(data.nodeData, data.datacenter, data.cluster, data.projectID);
          return true;
        }
        return false;
      })
    );
  }

  showMachineDeploymentEditDialog(
    md: MachineDeployment,
    cluster: Cluster,
    projectID: string,
    datacenter: Datacenter,
    changeEventEmitter: EventEmitter<MachineDeployment>
  ): Observable<boolean> {
    const dialogRef = this._matDialog.open(NodeDataModalComponent, {
      data: {
        cluster,
        datacenter,
        projectID,
        existingNodesCount: md.spec.replicas,
        editMode: true,
        machineDeployment: md,
        nodeData: {
          count: md.spec.replicas,
          name: md.name,
          spec: _.cloneDeep(md.spec.template),
          valid: true,
          dynamicConfig: md.spec.dynamicConfig,
        } as NodeData,
      },
    });

    return dialogRef
      .afterClosed()
      .pipe(
        flatMap(
          (data: NodeDataModalData): Observable<MachineDeployment> => {
            if (data) {
              return this._apiService
                .patchMachineDeployment(
                  data.machineDeployment,
                  NodeService._createPatch(data),
                  data.cluster.id,
                  data.datacenter.metadata.name,
                  data.projectID
                )
                .pipe(first())
                .pipe(
                  catchError(() => {
                    this._notificationService.error(
                      `Could not update the <strong>${data.machineDeployment.name}</strong> machine deployment `
                    );
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'machineDeploymentUpdateFailed');
                    return of(undefined);
                  })
                );
            }
            return of(undefined);
          }
        )
      )
      .pipe(
        flatMap(
          (md: MachineDeployment): Observable<boolean> => {
            if (md) {
              this._notificationService.success(`The <strong>${md.name}</strong> machine deployment was updated`);
              this._googleAnalyticsService.emitEvent('clusterOverview', 'machineDeploymentUpdated');
              if (changeEventEmitter) {
                changeEventEmitter.emit(md);
              }
              return of(true);
            }
            return of(false);
          }
        )
      )
      .pipe(first());
  }

  showMachineDeploymentDeleteDialog(
    md: MachineDeployment,
    clusterID: string,
    projectID: string,
    dcName: string,
    changeEventEmitter: EventEmitter<MachineDeployment>
  ): Observable<boolean> {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Machine Deployment',
        message: `Delete "<strong>${md.name}</strong>" permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');

    return dialogRef
      .afterClosed()
      .pipe(
        flatMap(
          (isConfirmed: boolean): Observable<boolean> => {
            if (isConfirmed) {
              return this._apiService
                .deleteMachineDeployment(clusterID, md, dcName, projectID)
                .pipe(first())
                .pipe(
                  catchError(() => {
                    this._notificationService.error(
                      'Could not remove the <strong>${md.name}</strong> machine deployment'
                    );
                    this._googleAnalyticsService.emitEvent('clusterOverview', 'machineDeploymentDeleteFailed');
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
              this._notificationService.success(`The <strong>${md.name}</strong> machine deployment was removed`);
              this._googleAnalyticsService.emitEvent('clusterOverview', 'machineDeploymentDeleted');
              if (changeEventEmitter) {
                changeEventEmitter.emit(md);
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
