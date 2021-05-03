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

import {Component, Input, OnDestroy} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification/service';
import {MLAService} from '@core/services/mla';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '@shared/entity/cluster';
import {AlertmanagerConfig} from '@shared/entity/mla';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {Mode, AlertmanagerConfigDialog} from './alertmanager-config-dialog/component';

@Component({
  selector: 'km-alertmanager-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AlertmanagerConfigComponent implements OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() alertmanagerConfig: AlertmanagerConfig;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _mlaService: MLAService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isLoadingData(): boolean {
    return _.isEmpty(this.alertmanagerConfig) && !this.isClusterRunning;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.alertmanagerConfig) && this.isClusterRunning;
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Alertmanager Config',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        mode: Mode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(AlertmanagerConfigDialog, dialogConfig);
  }

  edit(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Alertmanager Config',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        alertmanagerConfig: this.alertmanagerConfig,
        mode: Mode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(AlertmanagerConfigDialog, dialogConfig);
  }

  delete(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Alertmanager Config',
        message: 'Are you sure you want to delete the Alertmanager Config?',
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._mlaService.deleteAlertmanagerConfig(this.projectID, this.cluster.id)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success('The Alertmanager Config was deleted');
        this._mlaService.refreshAlertmanagerConfig();
      });
  }
}
