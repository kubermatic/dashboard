import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {interval, Subject} from 'rxjs';
import {debounce, takeUntil} from 'rxjs/operators';
import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {ClusterEntity, MasterVersion} from '../../shared/entity/ClusterEntity';
import {ClusterUtils} from '../../shared/utils/cluster-utils/cluster-utils';

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
      private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [Validators.required, Validators.minLength(5)]),
      version: new FormControl(this.cluster.spec.version),
      type: new FormControl(this.cluster.type),
    });

    if (this.clusterSpecForm.controls.type.value === '') {
      this.clusterSpecForm.controls.type.setValue('kubernetes');
    }

    this.clusterSpecForm.valueChanges.pipe(takeUntil(this._unsubscribe))
        .pipe(debounce(() => {
          return interval(1000);
        }))
        .subscribe(() => {
          this.loadMasterVersions();
          this.setClusterSpec();
        });

    this.loadMasterVersions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  generateName(): void {
    this.clusterSpecForm.patchValue({name: this._nameGenerator.generateName()});
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  loadMasterVersions(): void {
    this._api.getMasterVersions(this.clusterSpecForm.controls.type.value)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((versions) => {
          this.masterVersions = versions;
          for (const i in versions) {
            if (versions[i].default) {
              this.defaultVersion = versions[i].version;
              this.clusterSpecForm.controls.version.setValue(versions[i].version);
            }
          }
        });
  }

  setClusterSpec(): void {
    this._wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      type: this.clusterSpecForm.controls.type.value,
      version: this.clusterSpecForm.controls.version.value,
      valid: this.clusterSpecForm.valid,
    });
  }
}
