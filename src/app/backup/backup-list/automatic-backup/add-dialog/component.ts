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

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BackupService} from '@core/services/backup';
import {ClusterService} from '@core/services/cluster';
import {EtcdBackupConfig, EtcdBackupConfigSpec} from '@shared/entity/backup';
import {Cluster} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

export interface AddAutomaticBackupDialogConfig {
  projectID: string;
}

enum Controls {
  Cluster = 'cluster',
  Name = 'name',
  Group = 'group',
  Schedule = 'schedule',
  Keep = 'keep',
}

enum DefaultBackupSchedules {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

@Component({
  selector: 'km-add-automatic-backup-dialog',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class AddAutomaticBackupDialogComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  readonly Schedules = DefaultBackupSchedules;
  clusters: Cluster[] = [];
  form: FormGroup;

  constructor(
    private readonly _dialogRef: MatDialogRef<AddAutomaticBackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddAutomaticBackupDialogConfig,
    private readonly _clusterService: ClusterService,
    private readonly _backupService: BackupService,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Cluster]: this._builder.control('', Validators.required),
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Group]: this._builder.control(DefaultBackupSchedules.Daily, Validators.required),
      [Controls.Schedule]: this._builder.control(''),
      [Controls.Keep]: this._builder.control(1, Validators.min(1)),
    });

    this._clusterService
      .clusters(this._config.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));

    this.form
      .get(Controls.Group)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onScheduleChange.bind(this));
  }

  save(): void {
    this._backupService
      .create(this._config.projectID, this._toEtcdBackupConfig())
      .pipe(take(1))
      .subscribe(_ => this._dialogRef.close(true));
  }

  private _onScheduleChange(schedule: DefaultBackupSchedules): void {
    switch (schedule) {
      case DefaultBackupSchedules.Custom:
        this._updateFieldValidation(true);
        break;
      case DefaultBackupSchedules.Daily:
      case DefaultBackupSchedules.Monthly:
      case DefaultBackupSchedules.Weekly:
        this._updateFieldValidation(false);
    }
  }

  private _updateFieldValidation(required: boolean): void {
    if (required) {
      this.form.get(Controls.Schedule).setValidators(Validators.required);
      this.form.get(Controls.Keep).setValidators([Validators.required, Validators.min(1)]);
    } else {
      this.form.get(Controls.Schedule).clearValidators();
      this.form.get(Controls.Keep).setValidators(Validators.min(1));
    }

    this.form.get(Controls.Schedule).updateValueAndValidity();
    this.form.get(Controls.Keep).updateValueAndValidity();
  }

  private _toEtcdBackupConfig(): EtcdBackupConfig {
    return {
      spec: {
        name: this.form.get(Controls.Name).value,
      } as EtcdBackupConfigSpec,
    } as EtcdBackupConfig;
  }
}
