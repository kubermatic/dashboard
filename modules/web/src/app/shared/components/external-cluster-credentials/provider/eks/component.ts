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

import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ExternalClusterService} from '@core/services/external-cluster';
import {merge, Observable, of, Subject} from 'rxjs';
import {catchError, take, takeUntil, debounceTime, tap} from 'rxjs/operators';
import {ProjectService} from '@core/services/project';

export enum Controls {
  AccessKeyID = 'accessKeyID',
  SecretAccessKey = 'secretAccessKey',
  Region = 'region',
  AssumeRoleARN = 'assumeRoleARN',
  AssumeRoleExternalID = 'assumeRoleID',
  UseAssumeRole = 'useAssumeRole',
}

export enum RegionState {
  Ready = 'Regions',
  Loading = 'Loading...',
  Empty = 'No Regions Available',
}

@Component({
  selector: 'km-eks-credentials',
  templateUrl: './template.html',
  standalone: false,
})
export class EKSCredentialsComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly DEFAULT_LOCATION = 'eu-central-1';
  form: FormGroup;
  regions: string[] = [];
  regionLabel = RegionState.Ready;
  private readonly _debounceTime = 500;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _projectService: ProjectService
  ) {}

  get selectedPreset(): string {
    return this._externalClusterService.preset;
  }

  get isAssumeRoleEnabled(): boolean {
    return !!this.form.get(Controls.UseAssumeRole).value;
  }

  ngOnInit(): void {
    this.form = this._builder.group(
      {
        [Controls.AccessKeyID]: this._builder.control('', [Validators.required]),
        [Controls.SecretAccessKey]: this._builder.control('', [Validators.required]),
        [Controls.Region]: this._builder.control('', [Validators.required]),
        [Controls.UseAssumeRole]: this._builder.control(false),
        [Controls.AssumeRoleARN]: this._builder.control(''),
        [Controls.AssumeRoleExternalID]: this._builder.control(''),
      },
      {asyncValidators: [this._credentialsValidator.bind(this)]}
    );

    this.form.statusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._externalClusterService.isValidating = this.form.pending;
      this._externalClusterService.credentialsStepValidity = this.form.valid;
      this._externalClusterService.error = this.form.hasError('invalidCredentials')
        ? 'Provided credentials are invalid.'
        : undefined;
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._update();
      this._externalClusterService.isPresetEnabled = Object.values(Controls)
        .filter(key => key !== Controls.Region)
        .every(c => !this.form.get(c).value);
    });

    merge(
      this.form.get(Controls.AccessKeyID).valueChanges,
      this.form.get(Controls.SecretAccessKey).valueChanges,
      this.form.get(Controls.AssumeRoleARN).valueChanges,
      this.form.get(Controls.AssumeRoleExternalID).valueChanges
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._getEKSRegions();
      });

    this.form
      .get(Controls.Region)
      .valueChanges.pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(region => {
        this._externalClusterService.region = region;
      });

    this.form
      .get(Controls.UseAssumeRole)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        if (this.isAssumeRoleEnabled) {
          this.form.get(Controls.AssumeRoleARN).setValidators(Validators.required);
          this.form.get(Controls.AssumeRoleExternalID).setValidators(Validators.required);
        } else {
          this.form.get(Controls.AssumeRoleARN).clearValidators();
          this.form.get(Controls.AssumeRoleARN).setValue('');
          this.form.get(Controls.AssumeRoleExternalID).clearValidators();
          this.form.get(Controls.AssumeRoleExternalID).setValue('');
        }

        this.form.get(Controls.AssumeRoleARN).updateValueAndValidity();
        this.form.get(Controls.AssumeRoleExternalID).updateValueAndValidity();
        this._cdr.detectChanges();
      });

    this._externalClusterService.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      Object.values(Controls)
        .filter(key => key !== Controls.Region)
        .forEach(control => this._enable(!preset, control));

      this._getEKSRegions();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getEKSRegions(): void {
    let obs$;
    if (this.selectedPreset) {
      const presetValue = this.selectedPreset;
      obs$ = this._externalClusterService.getEKSRegions(this._projectService.selectedProjectID, presetValue);
    } else {
      const accessKeyID = this.form.get(Controls.AccessKeyID).value;
      const secretAccessKey = this.form.get(Controls.SecretAccessKey).value;
      if (accessKeyID && secretAccessKey) {
        obs$ = this._externalClusterService.getEKSRegions(
          this._projectService.selectedProjectID,
          null,
          accessKeyID,
          secretAccessKey
        );
      } else {
        obs$ = of([]);
      }
    }

    this.regionLabel = RegionState.Loading;
    obs$
      .pipe(tap(_ => this._clearRegions()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((regions: string[]) => {
        this.regions = regions;
        this.regionLabel = this.regions?.length ? RegionState.Ready : RegionState.Empty;
        if (regions.includes(this.DEFAULT_LOCATION)) {
          this.form.get(Controls.Region).setValue(this.DEFAULT_LOCATION);
        }
      });
  }

  private _clearRegions() {
    this.regions = [];
    this.regionLabel = RegionState.Ready;
    this.form.get(Controls.Region).setValue('', {emitEvent: false});
  }

  private _credentialsValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const accessKeyID = control.get(Controls.AccessKeyID).value;
    const secretAccessKey = control.get(Controls.SecretAccessKey).value;
    const region = control.get(Controls.Region).value;
    const assumeRoleARN = control.get(Controls.AssumeRoleARN).value;
    const assumeRoleExternalID = control.get(Controls.AssumeRoleExternalID).value;

    if (!accessKeyID || !secretAccessKey || !region) {
      return of(null);
    }

    return this._externalClusterService
      .validateEKSCredentials(
        this._projectService.selectedProjectID,
        accessKeyID,
        secretAccessKey,
        assumeRoleARN,
        assumeRoleExternalID,
        region
      )
      .pipe(take(1))
      .pipe(catchError(() => of({invalidCredentials: true})));
  }

  private _update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        eks: {
          name: '',
          accessKeyID: this.form.get(Controls.AccessKeyID).value,
          secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
          region: this.form.get(Controls.Region).value,
          assumeRoleARN: this.form.get(Controls.AssumeRoleARN).value,
          assumeRoleExternalID: this.form.get(Controls.AssumeRoleExternalID).value,
        },
      },
    };
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable({emitEvent: false});
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable({emitEvent: false});
    }
  }
}
