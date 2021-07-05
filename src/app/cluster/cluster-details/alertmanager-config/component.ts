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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {SettingsService} from '@core/services/settings';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {AlertmanagerConfig} from '@shared/entity/mla';
import {AdminSettings} from '@shared/entity/settings';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {AlertmanagerConfigDialog} from './alertmanager-config-dialog/component';

@Component({
  selector: 'km-alertmanager-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AlertmanagerConfigComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() alertmanagerConfig: AlertmanagerConfig;

  private _settings: AdminSettings;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _mlaService: MLAService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._settings = settings;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isLoadingData(): boolean {
    return _.isEmpty(this.alertmanagerConfig) && !this.isClusterRunning;
  }

  shouldDisplayAlertmanagerUILink(): boolean {
    return !!this._settings && !!this._settings.mlaAlertmanagerDomain;
  }

  getAlertmanagerURL(): string {
    const domain = this._settings.mlaAlertmanagerDomain || '';
    if (domain.slice(domain.length - 1) === '/') {
      return this._settings.mlaAlertmanagerDomain + this.cluster.id;
    }
    return this._settings.mlaAlertmanagerDomain + '/' + this.cluster.id;
  }

  edit(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Alertmanager Config',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        alertmanagerConfig: this.alertmanagerConfig,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(AlertmanagerConfigDialog, dialogConfig);
  }

  reset(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Reset Alertmanager Config',
        message: 'Are you sure you want to reset the Alertmanager Config?',
        confirmLabel: 'Reset',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._mlaService.resetAlertmanagerConfig(this.projectID, this.cluster.id)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success('The Alertmanager Config was reset');
        this._mlaService.refreshAlertmanagerConfig();
      });
  }
}
