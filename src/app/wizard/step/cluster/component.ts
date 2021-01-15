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
import {ApiService} from '@core/services/api/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {NameGeneratorService} from '@core/services/name-generator/service';
import {SettingsService} from '@core/services/settings/service';
import {Cluster, ClusterSpec, ClusterType, MasterVersion} from '@shared/entity/cluster';
import {ResourceType} from '@shared/entity/common';
import {Datacenter} from '@shared/entity/datacenter';
import {AdminSettings, ClusterTypeOptions} from '@shared/entity/settings';
import {ClusterService} from '@shared/services/cluster.service';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin-utils/admission-plugin-utils';
import {AsyncValidators} from '@shared/validators/async-label-form.validator';
import {merge} from 'rxjs';
import {filter, take, switchMap, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../service/wizard';
import {StepBase} from '../base';

enum Controls {
  Name = 'name',
  Version = 'version',
  Type = 'type',
  ImagePullSecret = 'imagePullSecret',
  AuditLogging = 'auditLogging',
  Labels = 'labels',
  AdmissionPlugins = 'admissionPlugins',
  SSHKeys = 'sshKeys',
  PodNodeSelectorAdmissionPluginConfig = 'podNodeSelectorAdmissionPluginConfig',
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
  admissionPlugin = AdmissionPlugin;
  masterVersions: MasterVersion[] = [];
  admissionPlugins: AdmissionPlugin[] = [];
  labels: object;
  podNodeSelectorAdmissionPluginConfig: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  readonly Controls = Controls;
  private _datacenterSpec: Datacenter;
  private _adminSettings: AdminSettings;
  private readonly _minNameLength = 5;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _api: ApiService,
    private readonly _settingsService: SettingsService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    wizard: WizardService
  ) {
    super(wizard);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: new FormControl('', [
        Validators.required,
        Validators.minLength(this._minNameLength),
        Validators.pattern('[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'),
      ]),
      [Controls.Version]: new FormControl('', [Validators.required]),
      [Controls.Type]: new FormControl(''),
      [Controls.ImagePullSecret]: new FormControl(''),
      [Controls.AuditLogging]: new FormControl(false),
      [Controls.AdmissionPlugins]: new FormControl([]),
      [Controls.PodNodeSelectorAdmissionPluginConfig]: new FormControl(''),
      [Controls.Labels]: new FormControl(''),
      [Controls.SSHKeys]: this._builder.control(''),
    });

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((dc: Datacenter) => {
        this._datacenterSpec = dc;
        this._enforce(Controls.AuditLogging, dc.spec.enforceAuditLogging);
        this._enforcePodSecurityPolicy(dc.spec.enforcePodSecurityPolicy);
      });

    this.control(Controls.Type)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap((type: ClusterType) => {
          this.masterVersions = [];
          this.control(Controls.Version).reset();
          this._handleImagePullSecret(type);
          this._clusterService.clusterType = type;

          return this._api.getMasterVersions(this.controlValue(Controls.Type) as ClusterType);
        })
      )
      .subscribe(this._setDefaultVersion.bind(this));

    this.control(Controls.Version)
      .valueChanges.pipe(filter(value => !!value))
      .pipe(switchMap(() => this._api.getAdmissionPlugins(this.form.get(Controls.Version).value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins.map(p => AdmissionPlugin[p]).filter(p => !!p)));

    this.control(Controls.AdmissionPlugins)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterService.admissionPlugins = this.form.get(Controls.AdmissionPlugins).value));

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Version).valueChanges,
      this.form.get(Controls.ImagePullSecret).valueChanges,
      this.form.get(Controls.AuditLogging).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!this._adminSettings) {
        this._adminSettings = settings;
        this._setDefaultClusterType();
      }

      if (this._adminSettings.clusterTypeOptions !== settings.clusterTypeOptions) {
        this._setDefaultClusterType();
      }

      this._adminSettings = settings;
    });
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  hasMultipleTypes(): boolean {
    return this._adminSettings.clusterTypeOptions === ClusterTypeOptions.All;
  }

  isOpenshiftSelected(): boolean {
    return this.controlValue(Controls.Type) === ClusterType.OpenShift;
  }

  onLabelsChange(labels: object): void {
    this.labels = labels;
    this._clusterService.labels = this.labels;
  }

  onPodNodeSelectorAdmissionPluginConfigChange(config: object): void {
    this.podNodeSelectorAdmissionPluginConfig = config;
    this._clusterService.podNodeSelectorAdmissionPluginConfig = this.podNodeSelectorAdmissionPluginConfig;
  }

  isEnforced(control: Controls): boolean {
    switch (control) {
      case Controls.AuditLogging:
        return !!this._datacenterSpec && this._datacenterSpec.spec.enforceAuditLogging;
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

  private _handleImagePullSecret(type: ClusterType): void {
    this.control(Controls.ImagePullSecret).setValidators(type === ClusterType.OpenShift ? [Validators.required] : []);
    this.control(Controls.ImagePullSecret).updateValueAndValidity();
  }

  private _setDefaultVersion(versions: MasterVersion[]): void {
    this.masterVersions = versions;
    for (const version of versions) {
      if (version.default) {
        this.control(Controls.Version).setValue(version.version);
      }
    }
  }

  private _setDefaultClusterType(): void {
    if (this._isClusterTypeVisible(ClusterTypeOptions.Kubernetes)) {
      this.control(Controls.Type).setValue(ClusterType.Kubernetes);
      return;
    }

    if (this._isClusterTypeVisible(ClusterTypeOptions.OpenShift)) {
      this.control(Controls.Type).setValue(ClusterType.OpenShift);
    }
  }

  private _isClusterTypeVisible(type: ClusterTypeOptions): boolean {
    return (
      this._adminSettings.clusterTypeOptions === ClusterTypeOptions.All ||
      this._adminSettings.clusterTypeOptions === type
    );
  }

  private _getClusterEntity(): Cluster {
    return {
      name: this.controlValue(Controls.Name),
      type: this.controlValue(Controls.Type),
      spec: {
        version: this.controlValue(Controls.Version),
        openshift: {
          imagePullSecret: this.controlValue(Controls.ImagePullSecret),
        },
        auditLogging: {
          enabled: this.controlValue(Controls.AuditLogging),
        },
      } as ClusterSpec,
    } as Cluster;
  }
}
