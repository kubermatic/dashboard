import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {interval, Subject} from 'rxjs';
import {debounce, first, switchMap, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {AdminSettings, ClusterTypeOptions} from '../../shared/entity/AdminSettings';
import {ClusterEntity, ClusterType, MasterVersion} from '../../shared/entity/ClusterEntity';
import {ResourceType} from '../../shared/entity/LabelsEntity';
import {AdmissionPlugin, AdmissionPluginUtils} from '../../shared/utils/admission-plugin-utils/admission-plugin-utils';
import {AsyncValidators} from '../../shared/validators/async-label-form.validator';

@Component({
  selector: 'km-set-cluster-spec',
  templateUrl: 'set-cluster-spec.component.html',
  styleUrls: ['set-cluster-spec.component.scss'],
})
export class SetClusterSpecComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() settings: AdminSettings;
  admissionPlugin = AdmissionPlugin;
  labels: object;
  clusterSpecForm: FormGroup;
  masterVersions: MasterVersion[] = [];
  defaultVersion: string;
  admissionPlugins: string[] = [];
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
    private readonly _nameGenerator: ClusterNameGenerator,
    private readonly _api: ApiService,
    private readonly _wizardService: WizardService
  ) {}

  ngOnInit(): void {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [
        Validators.required,
        Validators.minLength(5),
        Validators.pattern('[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'),
      ]),
      version: new FormControl(this.cluster.spec.version),
      type: new FormControl(this.cluster.type),
      imagePullSecret: new FormControl(),
      admissionPlugins: new FormControl(this.cluster.spec.admissionPlugins),
      auditLogging: new FormControl(!!this.cluster.spec.auditLogging && this.cluster.spec.auditLogging.enabled),
      labels: new FormControl(''),
    });

    if (this.clusterSpecForm.controls.type.value === '') {
      if (!this.hideKubernetes()) {
        this.clusterSpecForm.controls.type.setValue(ClusterType.Kubernetes);
      } else if (!this.hideOpenShift()) {
        this.clusterSpecForm.controls.type.setValue(ClusterType.OpenShift);
      }
    }

    this._setClusterTypeValidators();

    this._api
      .getMasterVersions(this.clusterSpecForm.controls.type.value)
      .pipe(first())
      .subscribe(this._setDefaultVersion.bind(this));

    this.clusterSpecForm.controls.type.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._api.getMasterVersions(this.clusterSpecForm.controls.type.value)))
      .subscribe(this._setDefaultVersion.bind(this));

    this.clusterSpecForm.controls.version.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._api.getAdmissionPlugins(this.clusterSpecForm.controls.version.value)))
      .subscribe(plugins => (this.admissionPlugins = plugins));

    this.clusterSpecForm.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .pipe(debounce(() => interval(100)))
      .subscribe(() => {
        this._setClusterTypeValidators();
        this.setClusterSpec();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isOpenShiftSelected(): boolean {
    return this.clusterSpecForm.controls.type.value === ClusterType.OpenShift;
  }

  private _setClusterTypeValidators(): void {
    if (this.clusterSpecForm.controls.type.value === ClusterType.OpenShift) {
      this.clusterSpecForm.controls.imagePullSecret.setValidators([Validators.required]);
    } else {
      this.clusterSpecForm.controls.imagePullSecret.clearValidators();
    }

    this.clusterSpecForm.controls.imagePullSecret.updateValueAndValidity();
  }

  generateName(): void {
    this.clusterSpecForm.patchValue({name: this._nameGenerator.generateName()});
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterEntity.getVersionHeadline(type, isKubelet);
  }

  hideKubernetes(): boolean {
    return this.settings.clusterTypeOptions === ClusterTypeOptions.OpenShift;
  }

  hideOpenShift(): boolean {
    return this.settings.clusterTypeOptions === ClusterTypeOptions.Kubernetes;
  }

  hasMultipleTypes(): boolean {
    return this.settings.clusterTypeOptions === ClusterTypeOptions.All;
  }

  getPluginName(name: string): string {
    return AdmissionPluginUtils.getPluginName(name);
  }

  isPluginEnabled(name: string): boolean {
    return AdmissionPluginUtils.isPluginEnabled(this.clusterSpecForm.controls.admissionPlugins, name);
  }

  setClusterSpec(): void {
    this._wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      type: this.clusterSpecForm.controls.type.value,
      labels: this.labels,
      version: this.clusterSpecForm.controls.version.value,
      imagePullSecret: this.clusterSpecForm.controls.imagePullSecret.value,
      admissionPlugins: this.clusterSpecForm.controls.admissionPlugins.value,
      auditLogging: {
        enabled: this.clusterSpecForm.controls.auditLogging.value,
      },
      valid: this.clusterSpecForm.valid,
    });
  }

  private _setDefaultVersion(versions: MasterVersion[]): void {
    this.masterVersions = versions;
    for (const version of versions) {
      if (version.default) {
        this.defaultVersion = version.version;
        this.clusterSpecForm.controls.version.setValue(version.version);
      }
    }
  }
}
