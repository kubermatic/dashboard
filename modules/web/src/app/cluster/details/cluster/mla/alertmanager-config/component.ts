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

import {Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {SettingsService} from '@core/services/settings';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Addon} from '@shared/entity/addon';
import {Cluster} from '@shared/entity/cluster';
import {SeedSettings} from '@shared/entity/datacenter';
import {AlertmanagerConfig} from '@shared/entity/mla';
import {AdminSettings} from '@shared/entity/settings';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AlertmanagerConfigDialog} from './alertmanager-config-dialog/component';
import {AddonService} from '@core/services/addon';
import {ProjectService} from '@app/core/services/project';
import {ProjectAnnotation} from '@app/shared/entity/project';

export enum Type {
  Alertmanager = 'Alertmanager',
  Grafana = 'Grafana',
}

export enum AddonType {
  NodeExporter = 'node-exporter',
  KubeStateMetrics = 'kube-state-metrics',
}

@Component({
  selector: 'km-alertmanager-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class AlertmanagerConfigComponent implements OnInit, OnDestroy {
  readonly Type = Type;
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() alertmanagerConfig: AlertmanagerConfig;
  @Input() addons: Addon[] = [];

  accessibleAddons: string[] = [];
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
    private readonly _addonService: AddonService,
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

    this._addonService.accessibleAddons
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(accessibleAddons => (this.accessibleAddons = accessibleAddons));
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
      this.shouldDisplayLink(Type.Grafana) &&
      (!this._isAddonEnabled(AddonType.NodeExporter) || !this._isAddonEnabled(AddonType.KubeStateMetrics))
    );
  }

  private _isAddonEnabled(addon: AddonType): boolean {
    return !!this.addons.find(a => a.id === addon);
  }

  private _isAddonAvailable(addon: AddonType): boolean {
    return !!this.accessibleAddons.find(a => a === addon);
  }

  getAddonsEnabledWarningText(): string {
    const nodeExporterEnabled = this._isAddonEnabled(AddonType.NodeExporter);
    const kubeStateMetricsEnabled = this._isAddonEnabled(AddonType.KubeStateMetrics);

    if (!nodeExporterEnabled && !kubeStateMetricsEnabled) {
      return 'Please enable the node-exporter addon to see node-related stats and the kube-state-metrics addon to see all k8s workload stats in Grafana dashboards';
    }

    if (!nodeExporterEnabled) {
      return 'Please enable the node-exporter addon to see node-related stats in Grafana dashboards';
    }

    if (!kubeStateMetricsEnabled) {
      return 'Please enable the kube-state-metrics addon to see all k8s workload stats in Grafana dashboards';
    }

    return '';
  }

  getAddonsAvailableWarningText(): string {
    const nodeExporterAvailable = this._isAddonAvailable(AddonType.NodeExporter);
    const kubeStateMetricsAvailable = this._isAddonAvailable(AddonType.KubeStateMetrics);

    if (!nodeExporterAvailable && !kubeStateMetricsAvailable) {
      return 'NOTE: The node-exporter and the kube-state-metrics addon are not available for installation in this cluster yet. Please contact your administrator for setting it up.';
    }

    if (!nodeExporterAvailable) {
      return 'NOTE: The node-exporter addon is not available for installation in this cluster yet. Please contact your administrator for setting it up.';
    }

    if (!kubeStateMetricsAvailable) {
      return 'NOTE: The kube-state-metrics addon is not available for installation in this cluster yet. Please contact your administrator for setting it up.';
    }

    return '';
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
        message: `Reset Alertmanager config of <b>${this.cluster.name}</b> cluster to default?`,
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
