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
import {merge} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, DatacenterService} from '../../../core/services';
import {ClusterNameGenerator} from '../../../core/util/name-generator.service';
import {ClusterEntity, ClusterSpec, ClusterType, MasterVersion} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ResourceType} from '../../../shared/entity/LabelsEntity';
import {AsyncValidators} from '../../../shared/validators/async-label-form.validator';
import {ClusterService} from '../../../shared/services/cluster.service';
import {WizardService} from '../../service/wizard';
import {StepBase} from '../base';

enum Controls {
  Name = 'name',
  Version = 'version',
  Type = 'type',
  ImagePullSecret = 'imagePullSecret',
  PodSecurityPolicyAdmissionPlugin = 'usePodSecurityPolicyAdmissionPlugin',
  AuditLogging = 'auditLogging',
  PodNodeSelectorAdmissionPlugin = 'usePodNodeSelectorAdmissionPlugin',
  Labels = 'labels',
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
  masterVersions: MasterVersion[] = [];
  labels: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];

  private _datacenterSpec: DataCenterEntity;
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _api: ApiService,
    private readonly _appConfig: AppConfigService,
    private readonly _nameGenerator: ClusterNameGenerator,
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
        Validators.minLength(5),
        Validators.pattern('[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'),
      ]),
      [Controls.Version]: new FormControl('', [Validators.required]),
      [Controls.Type]: new FormControl(''),
      [Controls.ImagePullSecret]: new FormControl(''),
      [Controls.AuditLogging]: new FormControl(false),
      [Controls.PodSecurityPolicyAdmissionPlugin]: new FormControl(false),
      [Controls.PodNodeSelectorAdmissionPlugin]: new FormControl(false),
      [Controls.Labels]: new FormControl(''),
    });

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this._datacenterSpec = dc;
        this._enforce(Controls.AuditLogging, dc.spec.enforceAuditLogging);
        this._enforce(Controls.PodSecurityPolicyAdmissionPlugin, dc.spec.enforcePodSecurityPolicy);
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

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Version).valueChanges,
      this.form.get(Controls.ImagePullSecret).valueChanges,
      this.form.get(Controls.AuditLogging).valueChanges,
      this.form.get(Controls.PodSecurityPolicyAdmissionPlugin).valueChanges,
      this.form.get(Controls.PodNodeSelectorAdmissionPlugin).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));

    this._setDefaultClusterType();
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  hasMultipleTypes(): boolean {
    return Object.values(ClusterType).every(type => !this._appConfig.getConfig()[`hide_${type}`]);
  }

  isOpenshiftSelected(): boolean {
    return this.controlValue(Controls.Type) === ClusterType.OpenShift;
  }

  onLabelsChange(labels: object): void {
    this.labels = labels;
    this._clusterService.labels = this.labels;
  }

  isEnforced(control: Controls): boolean {
    switch (control) {
      case Controls.AuditLogging:
        return !!this._datacenterSpec && this._datacenterSpec.spec.enforceAuditLogging;
      case Controls.PodSecurityPolicyAdmissionPlugin:
        return !!this._datacenterSpec && this._datacenterSpec.spec.enforcePodSecurityPolicy;
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
    if (this.controlValue(Controls.Type)) {
      return;
    }

    if (this._isClusterTypeVisible(ClusterType.Kubernetes)) {
      this.control(Controls.Type).setValue(ClusterType.Kubernetes);
      return;
    }

    if (this._isClusterTypeVisible(ClusterType.OpenShift)) {
      this.control(Controls.Type).setValue(ClusterType.OpenShift);
    }
  }

  private _isClusterTypeVisible(type: ClusterType): boolean {
    return !this._appConfig.getConfig()[`hide_${type}`];
  }

  private _getClusterEntity(): ClusterEntity {
    return {
      name: this.controlValue(Controls.Name),
      type: this.controlValue(Controls.Type),
      spec: {
        version: this.controlValue(Controls.Version),
        openshift: {
          imagePullSecret: this.controlValue(Controls.ImagePullSecret),
        },
        usePodNodeSelectorAdmissionPlugin: this.controlValue(Controls.PodNodeSelectorAdmissionPlugin),
        usePodSecurityPolicyAdmissionPlugin: this.controlValue(Controls.PodSecurityPolicyAdmissionPlugin),
        auditLogging: {
          enabled: this.controlValue(Controls.AuditLogging),
        },
      } as ClusterSpec,
    } as ClusterEntity;
  }
}
