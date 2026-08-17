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

import {Component, Inject, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {SettingsService} from '@core/services/settings';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Addon} from '@shared/entity/addon';
import {Application, KUBE_STATE_METRICS_APP_DEF_NAME, NODE_EXPORTER_APP_DEF_NAME} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {SeedSettings} from '@shared/entity/datacenter';
import {AlertmanagerConfig} from '@shared/entity/mla';
import {AdminSettings} from '@shared/entity/settings';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AlertmanagerConfigDialog} from './alertmanager-config-dialog/component';
import {ProjectService} from '@app/core/services/project';
import {ProjectAnnotation} from '@app/shared/entity/project';

export enum Type {
  Alertmanager = 'Alertmanager',
  Grafana = 'Grafana',
}

// node-exporter and kube-state-metrics are deployed as Applications by KKP when user cluster monitoring is enabled.
const MONITORING_COMPONENTS = [
  {name: NODE_EXPORTER_APP_DEF_NAME, metrics: 'node-related metrics'},
  {name: KUBE_STATE_METRICS_APP_DEF_NAME, metrics: 'Kubernetes workload metrics'},
];

@Component({
  selector: 'km-alertmanager-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class AlertmanagerConfigComponent implements OnInit, OnChanges, OnDestroy {
  readonly Type = Type;
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() alertmanagerConfig: AlertmanagerConfig;
  @Input() addons: Addon[] = [];
  @Input() applications: Application[] = [];

  grafanaWarningText = '';
  private _grafanaOrgId: string;
  private _settings: AdminSettings;
  private _seedSettings: SeedSettings;
  private _seed: string;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _mlaService: MLAService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _projectService: ProjectService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit(): void {
    this._projectService.selectedProject
      .pipe(take(1))
      .subscribe(project => (this._grafanaOrgId = project.annotations[ProjectAnnotation.GrafanaOrgId]));
    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this._settings = settings));

    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .pipe(tap(datacenter => (this._seed = datacenter.spec.seed)))
      .pipe(switchMap(_ => this._datacenterService.seedSettings(this._seed)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(seedSettings => (this._seedSettings = seedSettings));
  }

  ngOnChanges(): void {
    this.grafanaWarningText = this._getGrafanaWarningText();
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
    const seed =
      !!this._seedSettings && !!this._seedSettings.seedDNSOverwrite ? this._seedSettings.seedDNSOverwrite : this._seed;

    switch (type) {
      case Type.Alertmanager:
        return `https://${this._settings.mlaAlertmanagerPrefix}.${seed}.${this._document.defaultView.location.hostname}/${this.cluster.id}`;
      case Type.Grafana:
        return `https://${this._settings.mlaGrafanaPrefix}.${seed}.${this._document.defaultView.location.hostname}/?orgId=${this._grafanaOrgId}`;
      default:
        return '';
    }
  }

  displayGrafanaWarning(): boolean {
    return (
      this.shouldDisplayLink(Type.Grafana) && !!this.cluster?.spec.mla?.monitoringEnabled && !!this.grafanaWarningText
    );
  }

  private _isDeployed(name: string): boolean {
    return (
      !!this.applications?.some(application => application.spec?.applicationRef?.name === name) ||
      !!this.addons?.some(addon => addon.id === name)
    );
  }

  private _getGrafanaWarningText(): string {
    const missing = MONITORING_COMPONENTS.filter(component => !this._isDeployed(component.name));
    if (!missing.length) {
      return '';
    }

    const names = missing.map(component => component.name).join(' and ');
    const metrics = missing.map(component => component.metrics).join(' and ');
    const application = missing.length > 1 ? 'applications are' : 'application is';
    return `To see ${metrics} in Grafana dashboards, make sure the ${names} ${application} deployed in this cluster.`;
  }

  edit(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Alertmanager Config',
        projectId: this.projectID,
        cluster: this.cluster,
        alertmanagerConfig: this.alertmanagerConfig,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(AlertmanagerConfigDialog, dialogConfig);
  }

  reset(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Reset Alertmanager Config',
        message: `Reset Alertmanager config of <b>${_.escape(this.cluster.name)}</b> cluster to default?`,
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
        this._notificationService.success('Reset the Alertmanager config to the default value');
        this._mlaService.refreshAlertmanagerConfig();
      });
  }
}
