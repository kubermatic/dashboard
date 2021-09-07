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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  Validators,
} from '@angular/forms';
import {ApiService} from '@core/services/api';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NameGeneratorService} from '@core/services/name-generator';
import {SettingsService} from '@core/services/settings';
import {WizardService} from '@core/services/wizard/wizard';
import {
  Cluster,
  ClusterSpec,
  ClusterType,
  ContainerRuntime,
  END_OF_DOCKER_SUPPORT_VERSION,
  MasterVersion,
  ProxyMode,
} from '@shared/entity/cluster';
import {ResourceType} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {AdminSettings} from '@shared/entity/settings';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin-utils/admission-plugin-utils';
import {AsyncValidators} from '@shared/validators/async-label-form.validator';
import {combineLatest, merge} from 'rxjs';
import {filter, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {StepBase} from '../base';
import * as semver from 'semver';
import {CIDR_PATTERN_VALIDATOR} from '@shared/validators/others';

enum Controls {
  Name = 'name',
  Version = 'version',
  ContainerRuntime = 'containerRuntime',
  Type = 'type',
  AuditLogging = 'auditLogging',
  UserSSHKeyAgent = 'userSshKeyAgent',
  Labels = 'labels',
  AdmissionPlugins = 'admissionPlugins',
  SSHKeys = 'sshKeys',
  PodNodeSelectorAdmissionPluginConfig = 'podNodeSelectorAdmissionPluginConfig',
  OPAIntegration = 'opaIntegration',
  Konnectivity = 'konnectivity',
  MLALogging = 'loggingEnabled',
  MLAMonitoring = 'monitoringEnabled',
  ProxyMode = 'proxyMode',
  PodsCIDR = 'podsCIDR',
  ServicesCIDR = 'servicesCIDR',
}

@Component({
  selector: 'km-wizard-cluster-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClusterStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ClusterStepComponent),
      multi: true,
    },
  ],
})
export class ClusterStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  containerRuntime = ContainerRuntime;
  admissionPlugin = AdmissionPlugin;
  masterVersions: MasterVersion[] = [];
  admissionPlugins: AdmissionPlugin[] = [];
  labels: object;
  podNodeSelectorAdmissionPluginConfig: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  proxyMode = ProxyMode;
  readonly Controls = Controls;
  private _datacenterSpec: Datacenter;
  private _seedSettings: SeedSettings;
  private _settings: AdminSettings;
  private readonly _minNameLength = 5;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _api: ApiService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _settingsService: SettingsService,
    wizard: WizardService
  ) {
    super(wizard);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: new FormControl('', [
        Validators.required,
        Validators.minLength(this._minNameLength),
        Validators.pattern('[a-zA-Z0-9-]*'),
      ]),
      [Controls.Version]: new FormControl('', [Validators.required]),
      [Controls.ContainerRuntime]: new FormControl(ContainerRuntime.Containerd, [Validators.required]),
      [Controls.AuditLogging]: new FormControl(false),
      [Controls.UserSSHKeyAgent]: new FormControl(true),
      [Controls.OPAIntegration]: new FormControl(false),
      [Controls.Konnectivity]: new FormControl(false),
      [Controls.MLALogging]: new FormControl(false),
      [Controls.MLAMonitoring]: new FormControl(false),
      [Controls.AdmissionPlugins]: new FormControl([]),
      [Controls.PodNodeSelectorAdmissionPluginConfig]: new FormControl(''),
      [Controls.Labels]: new FormControl(''),
      [Controls.SSHKeys]: this._builder.control(''),
      [Controls.ProxyMode]: this._builder.control(''),
      [Controls.PodsCIDR]: new FormControl('', [CIDR_PATTERN_VALIDATOR]),
      [Controls.ServicesCIDR]: new FormControl('', [CIDR_PATTERN_VALIDATOR]),
    });

    this._settingsService.adminSettings.pipe(take(1)).subscribe(settings => {
      this._settings = settings;

      this.form.get(Controls.MLALogging).setValue(this._settings.mlaOptions.loggingEnabled, {emitEvent: false});
      this._enforce(Controls.MLALogging, this._settings.mlaOptions.loggingEnforced);
      this.form.get(Controls.MLAMonitoring).setValue(this._settings.mlaOptions.monitoringEnabled, {emitEvent: false});
      this._enforce(Controls.MLAMonitoring, this._settings.mlaOptions.monitoringEnforced);

      this.form.get(Controls.OPAIntegration).setValue(this._settings.opaOptions.enabled);
      if (this._settings.opaOptions.enforced) {
        this.form.get(Controls.OPAIntegration).disable();
      }
      this.form.updateValueAndValidity();
    });

    this._clusterSpecService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(
        tap((datacenter: Datacenter) => {
          this._datacenterSpec = datacenter;
          this._enforce(Controls.AuditLogging, datacenter.spec.enforceAuditLogging);
          this._enforcePodSecurityPolicy(datacenter.spec.enforcePodSecurityPolicy);
        })
      )
      .pipe(switchMap(_ => this._datacenterService.seedSettings(this._datacenterSpec.spec.seed)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((seedSettings: SeedSettings) => (this._seedSettings = seedSettings));

    this._api
      .getMasterVersions(ClusterType.Kubernetes)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultVersion.bind(this));

    combineLatest([
      this.control(Controls.Version).valueChanges.pipe(startWith(this.control(Controls.Version).value)),
      this.control(Controls.ContainerRuntime).valueChanges.pipe(
        startWith(this.control(Controls.ContainerRuntime).value)
      ),
    ])
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([version, containerRuntime]) => {
        if (
          semver.valid(version) &&
          semver.gte(version, END_OF_DOCKER_SUPPORT_VERSION) &&
          containerRuntime === ContainerRuntime.Docker
        ) {
          this.control(Controls.ContainerRuntime).setErrors({dockerVersionCompatibility: true});
        } else {
          this.control(Controls.ContainerRuntime).setErrors(null);
        }
      });

    this.control(Controls.Version)
      .valueChanges.pipe(filter(value => !!value))
      .pipe(switchMap(() => this._api.getAdmissionPlugins(this.form.get(Controls.Version).value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins.map(p => AdmissionPlugin[p]).filter(p => !!p)));

    this.control(Controls.AdmissionPlugins)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterSpecService.admissionPlugins = this.form.get(Controls.AdmissionPlugins).value));

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Version).valueChanges,
      this.form.get(Controls.AuditLogging).valueChanges,
      this.form.get(Controls.UserSSHKeyAgent).valueChanges,
      this.form.get(Controls.OPAIntegration).valueChanges,
      this.form.get(Controls.Konnectivity).valueChanges,
      this.form.get(Controls.MLALogging).valueChanges,
      this.form.get(Controls.MLAMonitoring).valueChanges,
      this.form.get(Controls.ContainerRuntime).valueChanges,
      this.form.get(Controls.ProxyMode).valueChanges,
      this.form.get(Controls.PodsCIDR).valueChanges,
      this.form.get(Controls.ServicesCIDR).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  onLabelsChange(labels: object): void {
    this.labels = labels;
    this._clusterSpecService.labels = this.labels;
  }

  onPodNodeSelectorAdmissionPluginConfigChange(config: object): void {
    this.podNodeSelectorAdmissionPluginConfig = config;
    this._clusterSpecService.podNodeSelectorAdmissionPluginConfig = this.podNodeSelectorAdmissionPluginConfig;
  }

  isEnforced(control: Controls): boolean {
    switch (control) {
      case Controls.AuditLogging:
        return !!this._datacenterSpec && this._datacenterSpec.spec.enforceAuditLogging;
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

  isPodSecurityPolicyEnforced(): boolean {
    return AdmissionPluginUtils.isPodSecurityPolicyEnforced(this._datacenterSpec);
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

  private _enforce(control: Controls, isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(control).setValue(true);
      this.form.get(control).disable();
    }
  }

  private _enforcePodSecurityPolicy(isEnforced: boolean): void {
    if (isEnforced) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }
  }

  private _setDefaultVersion(versions: MasterVersion[]): void {
    this.masterVersions = versions;
    for (const version of versions) {
      if (version.default) {
        this.control(Controls.Version).setValue(version.version);
      }
    }
  }

  private _getClusterEntity(): Cluster {
    const pods = this.controlValue(Controls.PodsCIDR);
    const services = this.controlValue(Controls.ServicesCIDR);
    return {
      name: this.controlValue(Controls.Name),
      type: ClusterType.Kubernetes,
      spec: {
        version: this.controlValue(Controls.Version),
        auditLogging: {
          enabled: this.controlValue(Controls.AuditLogging),
        },
        opaIntegration: {
          enabled: this.controlValue(Controls.OPAIntegration),
        },
        mla: {
          loggingEnabled: this.controlValue(Controls.MLALogging),
          monitoringEnabled: this.controlValue(Controls.MLAMonitoring),
        },
        enableUserSSHKeyAgent: this.controlValue(Controls.UserSSHKeyAgent),
        containerRuntime: this.controlValue(Controls.ContainerRuntime),
        clusterNetwork: {
          proxyMode: this.controlValue(Controls.ProxyMode),
          pods: {cidrBlocks: pods ? [pods] : []},
          services: {cidrBlocks: services ? [services] : []},
          konnectivityEnabled: this.controlValue(Controls.Konnectivity),
        },
      } as ClusterSpec,
    } as Cluster;
  }
}
