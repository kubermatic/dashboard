import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {interval, Subject} from 'rxjs';
import {debounce, first, map, switchMap, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../app-config.service';
import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {ClusterEntity, MasterVersion} from '../../shared/entity/ClusterEntity';
import {ClusterType, ClusterUtils} from '../../shared/utils/cluster-utils/cluster-utils';

@Component({
  selector: 'kubermatic-set-cluster-spec',
  templateUrl: 'set-cluster-spec.component.html',
  styleUrls: ['set-cluster-spec.component.scss'],
})

export class SetClusterSpecComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  clusterSpecForm: FormGroup;
  masterVersions: MasterVersion[] = [];
  defaultVersion: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _nameGenerator: ClusterNameGenerator, private readonly _api: ApiService,
      private readonly _wizardService: WizardService, private _appConfig: AppConfigService) {}

  ngOnInit(): void {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(
          this.cluster.name, [Validators.required, Validators.minLength(5), Validators.pattern('[a-zA-Z0-9-]*')]),
      version: new FormControl(this.cluster.spec.version),
      type: new FormControl(this.cluster.type),
      imagePullSecret: new FormControl(),
    });

    if (this.clusterSpecForm.controls.type.value === '') {
      if (!this.hideType(ClusterType.Kubernetes)) {
        this.clusterSpecForm.controls.type.setValue(ClusterType.Kubernetes);
      } else if (!this.hideType(ClusterType.OpenShift)) {
        this.clusterSpecForm.controls.type.setValue(ClusterType.OpenShift);
      }
    }

    this._setClusterTypeValidators();

    this._api.getMasterVersions(this.clusterSpecForm.controls.type.value)
        .pipe(first())
        .subscribe(this._setDefaultVersion.bind(this));

    this.clusterSpecForm.controls.type.valueChanges.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._api.getMasterVersions(this.clusterSpecForm.controls.type.value)))
        .subscribe(this._setDefaultVersion.bind(this));

    this.clusterSpecForm.valueChanges.pipe(takeUntil(this._unsubscribe))
        .pipe(map(() => this._invalidateStep()))
        .pipe(debounce(() => interval(500)))
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
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  hideType(type: string): boolean {
    return !!this._appConfig.getConfig()['hide_' + type] ? this._appConfig.getConfig()['hide_' + type] : false;
  }

  hasMultipleTypes(): boolean {
    return !this.hideType(ClusterType.Kubernetes) && !this.hideType(ClusterType.OpenShift);
  }

  setClusterSpec(): void {
    this._wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      type: this.clusterSpecForm.controls.type.value,
      version: this.clusterSpecForm.controls.version.value,
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

  private _invalidateStep(): void {
    this._wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      type: this.clusterSpecForm.controls.type.value,
      version: this.clusterSpecForm.controls.version.value,
      valid: false,
    });
  }
}
