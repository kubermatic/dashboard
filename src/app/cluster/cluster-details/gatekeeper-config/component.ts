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
import {OPAService} from '@core/services/opa/service';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '@shared/entity/cluster';
import {GatekeeperConfig} from '@shared/entity/opa';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {Mode, GatekeeperConfigDialog} from './gatekeeper-config-dialog/component';

@Component({
  selector: 'km-gatekeeper-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class GatekeeperConfigComponent implements OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() gatekeeperConfig: GatekeeperConfig;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _opaService: OPAService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isLoadingData(): boolean {
    return _.isEmpty(this.gatekeeperConfig) && !this.isClusterRunning;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.gatekeeperConfig) && this.isClusterRunning;
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Gatekeeper Config',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        mode: Mode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(GatekeeperConfigDialog, dialogConfig);
  }

  edit(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Gatekeeper Config',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        gatekeeperConfig: this.gatekeeperConfig,
        mode: Mode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(GatekeeperConfigDialog, dialogConfig);
  }

  delete(): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Gatekeeper Config',
        message: 'Are you sure you want to delete the Gatekeeper Config?',
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._opaService.deleteGatekeeperConfig(this.projectID, this.cluster.id)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success('The Gatekeeper Config was deleted');
        this._opaService.refreshGatekeeperConfig();
      });
  }
}
