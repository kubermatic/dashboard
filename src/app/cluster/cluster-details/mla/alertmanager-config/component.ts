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

import {Component, Input, OnDestroy, OnInit, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {SettingsService} from '@core/services/settings';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {AlertmanagerConfig} from '@shared/entity/mla';
import {AdminSettings} from '@shared/entity/settings';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {AlertmanagerConfigDialog} from './alertmanager-config-dialog/component';

export enum Type {
  Alertmanager = 'Alertmanager',
  Grafana = 'Grafana',
}

@Component({
  selector: 'km-alertmanager-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AlertmanagerConfigComponent implements OnInit, OnDestroy {
  readonly Type = Type;
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() alertmanagerConfig: AlertmanagerConfig;

  private _settings: AdminSettings;
  private _seed: string;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _mlaService: MLAService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService,
    private readonly _datacenterService: DatacenterService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this._settings = settings));

    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenter => (this._seed = datacenter.spec.seed));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  shouldDisplayLink(type: string): boolean {
    switch (type) {
      case Type.Alertmanager:
        return !!this._settings && !!this._settings.mlaAlertmanagerPrefix;
      case Type.Grafana:
        return !!this._settings && !!this._settings.mlaGrafanaPrefix;
      default:
        return false;
    }
  }

  getLinkURL(type: string): string {
    switch (type) {
      case Type.Alertmanager:
        return (
          'https://' +
          this._settings.mlaAlertmanagerPrefix +
          '.' +
          this._seed +
          '.' +
          this._document.defaultView.location.hostname +
          '/' +
          this.cluster.id
        );
      case Type.Grafana:
        return (
          'https://' +
          this._settings.mlaGrafanaPrefix +
          '.' +
          this._seed +
          '.' +
          this._document.defaultView.location.hostname
        );
      default:
        return '';
    }
  }

  edit(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Alertmanager Config',
        projectId: this.projectID,
        clusterId: this.cluster,
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
        message: 'Reset Alertmanager Config of <b>${this.cluster.name}</b> cluster to default?',
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
