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
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '@core/services/api';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {Cluster, ClusterPatch, ProviderSettingsPatch} from '@shared/entity/cluster';
import {ResourceType} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {AdminSettings} from '@shared/entity/settings';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin-utils/admission-plugin-utils';
import {AsyncValidators} from '@shared/validators/async-label-form.validator';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  Name = 'name',
  AuditLogging = 'auditLogging',
  Labels = 'labels',
  AdmissionPlugins = 'admissionPlugins',
  PodNodeSelectorAdmissionPluginConfig = 'podNodeSelectorAdmissionPluginConfig',
  OPAIntegration = 'opaIntegration',
  MLALogging = 'loggingEnabled',
  MLAMonitoring = 'monitoringEnabled',
}

@Component({
  selector: 'km-edit-cluster',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EditClusterComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  datacenter: Datacenter;
  admissionPlugin = AdmissionPlugin;
  form: FormGroup;
  labels: object;
  podNodeSelectorAdmissionPluginConfig: object;
  admissionPlugins: string[] = [];
  providerSettingsPatch: ProviderSettingsPatch = {
    isValid: true,
    cloudSpecPatch: {},
  };
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];

  readonly Controls = Controls;
  private readonly _nameMinLen = 3;
  private _settings: AdminSettings;
  private _seedSettings: SeedSettings;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService,
    private readonly _apiService: ApiService,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialogRef: MatDialogRef<EditClusterComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.cluster.labels);
    this.podNodeSelectorAdmissionPluginConfig = _.cloneDeep(this.cluster.spec.podNodeSelectorAdmissionPluginConfig);

    this.form = this._builder.group({
      [Controls.Name]: new FormControl(this.cluster.name, [
        Validators.required,
        Validators.minLength(this._nameMinLen),
        Validators.pattern('[a-zA-Z0-9-]*'),
      ]),
      [Controls.AuditLogging]: new FormControl(
        !!this.cluster.spec.auditLogging && this.cluster.spec.auditLogging.enabled
      ),
      [Controls.OPAIntegration]: new FormControl(
        !!this.cluster.spec.opaIntegration && this.cluster.spec.opaIntegration.enabled
      ),
      [Controls.MLALogging]: new FormControl(!!this.cluster.spec.mla && this.cluster.spec.mla.loggingEnabled),
      [Controls.MLAMonitoring]: new FormControl(!!this.cluster.spec.mla && this.cluster.spec.mla.monitoringEnabled),
      [Controls.AdmissionPlugins]: new FormControl(this.cluster.spec.admissionPlugins),
      [Controls.PodNodeSelectorAdmissionPluginConfig]: new FormControl(''),
      [Controls.Labels]: new FormControl(''),
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._settings = settings;
      this._enforce(Controls.OPAIntegration, this._settings.opaOptions.enforced);
      this._enforce(Controls.MLALogging, this._settings.mlaOptions.loggingEnforced);
      this._enforce(Controls.MLAMonitoring, this._settings.mlaOptions.monitoringEnforced);
    });

    this._clusterService.providerSettingsPatchChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(patch => (this.providerSettingsPatch = patch));

    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(tap(datacenter => (this.datacenter = datacenter)))
      .pipe(switchMap(_ => this._datacenterService.seedSettings(this.datacenter.spec.seed)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(seedSettings => (this._seedSettings = seedSettings));

    this._apiService
      .getAdmissionPlugins(this.cluster.spec.version)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins));

    this.checkForLegacyAdmissionPlugins();
  }

  checkForLegacyAdmissionPlugins(): void {
    if (this.cluster.spec.usePodNodeSelectorAdmissionPlugin) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodNodeSelector
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }

    if (this.cluster.spec.usePodSecurityPolicyAdmissionPlugin) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }

    this.checkEnforcedFieldsState();
  }

  checkEnforcedFieldsState(): void {
    if (this.datacenter.spec.enforceAuditLogging) {
      this.form.get(Controls.AuditLogging).setValue(true);
      this.form.get(Controls.AuditLogging).disable();
    }

    if (this.datacenter.spec.enforcePodSecurityPolicy) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }
  }

  getPluginName(name: string): string {
    return AdmissionPluginUtils.getPluginName(name);
  }

  isPluginEnabled(name: string): boolean {
    return AdmissionPluginUtils.isPluginEnabled(this.form.get(Controls.AdmissionPlugins), name);
  }

  isMLAEnabled(): boolean {
    return !!this._seedSettings && !!this._seedSettings.mla && !!this._seedSettings.mla.user_cluster_mla_enabled;
  }

  isPodSecurityPolicyEnforced(): boolean {
    return AdmissionPluginUtils.isPodSecurityPolicyEnforced(this.datacenter);
  }

  isEnforced(control: Controls): boolean {
    switch (control) {
      case Controls.OPAIntegration:
        return !!this._settings && this._settings.opaOptions.enforced;
      case Controls.MLALogging:
        return !!this._settings && this._settings.mlaOptions.loggingEnforced;
      case Controls.MLAMonitoring:
        return !!this._settings && this._settings.mlaOptions.monitoringEnforced;
      default:
        return false;
    }
  }

  private _enforce(control: Controls, isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(control).setValue(true);
      this.form.get(control).disable();
    }
  }

  editCluster(): void {
    if (!this.form.valid) {
      return;
    }

    const patch: ClusterPatch = {
      name: this.form.get(Controls.Name).value,
      labels: this.labels,
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
        auditLogging: {
          enabled: this.form.get(Controls.AuditLogging).value,
        },
        opaIntegration: {
          enabled: this.form.get(Controls.OPAIntegration).value,
        },
        mla: {
          loggingEnabled: this.form.get(Controls.MLALogging).value,
          monitoringEnabled: this.form.get(Controls.MLAMonitoring).value,
        },
        usePodNodeSelectorAdmissionPlugin: null,
        usePodSecurityPolicyAdmissionPlugin: null,
        admissionPlugins: this.form.get(Controls.AdmissionPlugins).value,
        podNodeSelectorAdmissionPluginConfig: this.podNodeSelectorAdmissionPluginConfig,
      },
    };

    this._clusterService.patch(this.projectID, this.cluster.id, patch).subscribe(cluster => {
      this._matDialogRef.close(cluster);
      this._clusterService.onClusterUpdate.next();
      this._notificationService.success(`The ${this.cluster.name} cluster was updated`);
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
