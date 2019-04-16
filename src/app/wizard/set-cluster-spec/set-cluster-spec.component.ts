import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {interval, Subscription} from 'rxjs';
import {debounce} from 'rxjs/operators';
import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {ClusterEntity, MasterVersion} from '../../shared/entity/ClusterEntity';

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
  private subscriptions: Subscription[] = [];

  constructor(
      private readonly _nameGenerator: ClusterNameGenerator, private readonly _api: ApiService,
      private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [Validators.required, Validators.minLength(5)]),
      version: new FormControl(this.cluster.spec.version),
    });

    this.subscriptions.push(this.clusterSpecForm.valueChanges
                                .pipe(debounce(() => {
                                  this._invalidateStep();
                                  return interval(1000);
                                }))
                                .subscribe(() => {
                                  this.setClusterSpec();
                                }));

    this.loadMasterVersions();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  generateName(): void {
    this.clusterSpecForm.patchValue({name: this._nameGenerator.generateName()});
  }

  loadMasterVersions(): void {
    this.subscriptions.push(this._api.getMasterVersions().subscribe((versions) => {
      this.masterVersions = versions;
      for (const i in versions) {
        if (versions[i].default) {
          this.defaultVersion = versions[i].version;
          this.clusterSpecForm.controls.version.setValue(versions[i].version);
        }
      }
    }));
  }

  setClusterSpec(): void {
    this._wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      version: this.clusterSpecForm.controls.version.value,
      valid: this.clusterSpecForm.valid,
    });
  }

  private _invalidateStep(): void {
    this._wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      version: this.clusterSpecForm.controls.version.value,
      valid: false,
    });
  }
}
