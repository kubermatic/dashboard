// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {KmValidators} from '@app/shared/validators/validators';
import {BackupService} from '@core/services/backup';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {EtcdBackupConfig, EtcdBackupConfigSpec} from '@shared/entity/backup';
import {Cluster} from '@shared/entity/cluster';
import {NON_SPECIAL_CHARACTERS_PATTERN_VALIDATOR} from '@shared/validators/others';
import {EMPTY, iif, Observable, Subject} from 'rxjs';
import {switchMap, take, takeUntil, tap} from 'rxjs/operators';

export interface AddAutomaticBackupDialogConfig {
  projectID: string;
}

enum Controls {
  Cluster = 'cluster',
  Name = 'name',
  Group = 'group',
  Schedule = 'schedule',
  Keep = 'keep',
  Destination = 'destination',
}

enum DefaultSchuleOption {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

enum DefaultSchedule {
  Daily = '00 22 * * *',
  Weekly = '00 22 * * 1',
  Monthly = '00 22 1 * *',
}

enum DefaultScheduleKeep {
  Daily = 7,
  Weekly = 4,
  Monthly = 3,
}

@Component({
  selector: 'km-add-automatic-backup-dialog',
  templateUrl: './template.html',
})
export class AddAutomaticBackupDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  readonly ScheduleOption = DefaultSchuleOption;
  clusters: Cluster[] = [];
  destinations: string[] = [];
  seed = '';
  isAdmin = false;
  form: FormGroup;
  isLoadingDestinations = false;

  private get _selectedClusterID(): string {
    return this.form.get(Controls.Cluster).value;
  }

  private get _backupSchedule(): DefaultSchuleOption {
    return this.form.get(Controls.Group).value;
  }

  private get _schedule(): string {
    switch (this._backupSchedule) {
      case DefaultSchuleOption.Daily:
        return DefaultSchedule.Daily;
      case DefaultSchuleOption.Weekly:
        return DefaultSchedule.Weekly;
      case DefaultSchuleOption.Monthly:
        return DefaultSchedule.Monthly;
      case DefaultSchuleOption.Custom:
        return this.form.get(Controls.Schedule).value;
    }
  }

  private get _keep(): number {
    switch (this._backupSchedule) {
      case DefaultSchuleOption.Daily:
        return DefaultScheduleKeep.Daily;
      case DefaultSchuleOption.Weekly:
        return DefaultScheduleKeep.Weekly;
      case DefaultSchuleOption.Monthly:
        return DefaultScheduleKeep.Monthly;
      case DefaultSchuleOption.Custom:
        return this.form.get(Controls.Keep).value;
    }
  }

  constructor(
    private readonly _dialogRef: MatDialogRef<AddAutomaticBackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddAutomaticBackupDialogConfig,
    private readonly _clusterService: ClusterService,
    private readonly _backupService: BackupService,
    private readonly _builder: FormBuilder,
    private readonly _notificationService: NotificationService,
    private readonly _datacenterService: DatacenterService,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Cluster]: this._builder.control('', Validators.required),
      [Controls.Name]: this._builder.control('', [Validators.required, NON_SPECIAL_CHARACTERS_PATTERN_VALIDATOR]),
      [Controls.Destination]: this._builder.control('', Validators.required),
      [Controls.Group]: this._builder.control(DefaultSchuleOption.Daily, Validators.required),
      [Controls.Schedule]: this._builder.control(''),
      [Controls.Keep]: this._builder.control(1, Validators.min(1)),
    });

    this._clusterService
      .clusters(this._config.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));

    this.form
      .get(Controls.Group)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onScheduleChange.bind(this));

    this.form
      .get(Controls.Cluster)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onClusterChange.bind(this));
  }

  getObservable(): Observable<EtcdBackupConfig> {
    return this._backupService
      .create(this._config.projectID, this._selectedClusterID, this._toEtcdBackupConfig())
      .pipe(take(1));
  }

  onNext(): void {
    this._dialogRef.close(true);
    this._notificationService.success(`Created the ${this._toEtcdBackupConfig().name} automatic backup`);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasClusterInput(): boolean {
    return !!this._selectedClusterID;
  }

  hasDestinations(): boolean {
    return this.destinations?.length > 0;
  }

  private _onScheduleChange(schedule: DefaultSchuleOption): void {
    switch (schedule) {
      case DefaultSchuleOption.Custom:
        this._updateFieldValidation(true);
        break;
      case DefaultSchuleOption.Daily:
      case DefaultSchuleOption.Monthly:
      case DefaultSchuleOption.Weekly:
        this._updateFieldValidation(false);
    }
  }

  private _updateFieldValidation(required: boolean): void {
    if (required) {
      this.form.get(Controls.Schedule).setValidators([Validators.required, KmValidators.cronExpression()]);
      this.form.get(Controls.Keep).setValidators([Validators.required, Validators.min(1)]);
    } else {
      this.form.get(Controls.Schedule).clearValidators();
      this.form.get(Controls.Keep).setValidators(Validators.min(1));
    }

    this.form.get(Controls.Schedule).updateValueAndValidity();
    this.form.get(Controls.Keep).updateValueAndValidity();
  }

  private _onClusterChange(clusterID: string): void {
    this.isLoadingDestinations = true;
    const observer = {
      next: dc => (this.seed = dc.spec.seed),
      error: () => {},
      complete: () => (this.isLoadingDestinations = false),
    };

    this._backupService
      .getDestinations(this._config.projectID, clusterID)
      .pipe(tap(destinations => (this.destinations = destinations)))
      .pipe(
        switchMap(_ => {
          const cluster = this.clusters.find(c => c.id === clusterID);
          return iif(() => cluster !== undefined, this._datacenterService.getDatacenter(cluster.spec.cloud.dc), EMPTY);
        })
      )
      .pipe(take(1))
      .subscribe(observer);
  }

  private _toEtcdBackupConfig(): EtcdBackupConfig {
    return {
      name: this.form.get(Controls.Name).value,
      spec: {
        clusterId: this._selectedClusterID,
        keep: this._keep,
        schedule: this._schedule,
        destination: this.form.get(Controls.Destination).value,
      } as EtcdBackupConfigSpec,
    } as EtcdBackupConfig;
  }
}
