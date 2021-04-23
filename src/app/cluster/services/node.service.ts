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
import {catchError, filter, first, flatMap, switchMap} from 'rxjs/operators';

import {ApiService, NotificationService} from '../../core/services';
import {DialogDataInput, DialogDataOutput, NodeDataDialogComponent} from '../../node-data/dialog/component';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '../../shared/entity/cluster';
import {MachineDeployment, MachineDeploymentPatch} from '../../shared/entity/machine-deployment';
import {NodeData} from '../../shared/model/NodeSpecChange';

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

  createMachineDeployment(
    nodeData: NodeData,
    projectID: string,
    seedDCName: string,
    clusterID: string
  ): Observable<MachineDeployment> {
    return this._apiService.createMachineDeployment(
      NodeService._getMachineDeploymentEntity(nodeData),
      clusterID,
      seedDCName,
      projectID
    );
  }

  showMachineDeploymentCreateDialog(cluster: Cluster, projectID: string, seed: string): Observable<MachineDeployment> {
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
      .pipe(switchMap(data => this.createMachineDeployment(data.nodeData, projectID, seed, cluster.id)));
  }

  showMachineDeploymentEditDialog(
    md: MachineDeployment,
    cluster: Cluster,
    projectID: string,
    seed: string
  ): Observable<MachineDeployment> {
    const dialogRef = this._matDialog.open(NodeDataDialogComponent, {
      data: {
        existingNodesCount: md.spec.replicas,
        initialClusterData: cluster,
        initialNodeData: {
          count: md.spec.replicas,
          name: md.name,
          spec: md.spec.template,
          dynamicConfig: md.spec.dynamicConfig,
        } as NodeData,
      },
    });

    return dialogRef
      .afterClosed()
      .pipe(filter(data => !!data))
      .pipe(
        switchMap(data =>
          this._apiService.patchMachineDeployment(NodeService._createPatch(data), md.id, cluster.id, seed, projectID)
        )
      );
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
                    this._notificationService.error('Could not remove the <strong>${md.name}</strong> machine deployment');
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
