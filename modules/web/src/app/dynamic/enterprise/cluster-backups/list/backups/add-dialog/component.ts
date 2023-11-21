// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BackupService} from '@core/services/backup';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {ClusterService} from '@core/services/cluster';
import {Observable, Subject, takeUntil} from 'rxjs';
import {RBACService} from '@core/services/rbac';
import {ClusterBackup} from '@app/shared/entity/backup';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {KmValidators} from '@app/shared/validators/validators';

enum Controls {
  Name = 'name',
  Clusters = 'clusters',
  Destination = 'destination',
  NameSpaces = 'namespaces',
  Schedule = 'schedule',
  CronJob = 'cronjob',
  ExpiredAt = 'expiredAt',
  Labels = 'labels',
}

enum DefaultSchuleOption {
  Now = 'Now',
  Custom = 'Custom',
}

@Component({
  selector: 'km-add-cluster-backups-dialog-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddClustersBackupsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly ScheduleOption = DefaultSchuleOption;
  projectID = this._config.projectID;
  clusters: Cluster[] = [];
  destinations: string[] = [];
  isAdmin = false;
  nameSpaces: string[] = [];
  labels: Record<string, string>;

  readonly Controls = Controls;
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddClustersBackupsDialogComponent,
    private readonly _dialogRef: MatDialogRef<AddClustersBackupsDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService,
    private readonly _backupService: BackupService,
    private readonly _userService: UserService,
    private readonly _rbacService: RBACService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Destination]: this._builder.control('', Validators.required),
      [Controls.Clusters]: this._builder.control('', Validators.required),
      [Controls.NameSpaces]: this._builder.control([], Validators.required),
      [Controls.Schedule]: this._builder.control(DefaultSchuleOption.Now, Validators.required),
      [Controls.CronJob]: this._builder.control(''),
      [Controls.ExpiredAt]: this._builder.control(''),
      [Controls.Labels]: this._builder.control(''),
    });

    this._clusterService
      .clusters(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));

    this.form
      .get(Controls.Clusters)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(cluster => {
        this.getDestinations(this.projectID, cluster);
        this.getClusterNamespaces(this.projectID, cluster);
      });

    this.form
      .get(Controls.Schedule)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const cronJobControl = this.form.get(Controls.CronJob);
        if (value === DefaultSchuleOption.Custom) {
          cronJobControl.enable();
          cronJobControl.setValidators([Validators.required, KmValidators.cronExpression()]);
        } else {
          cronJobControl.disable();
          cronJobControl.clearValidators();
        }
        this._cdr.detectChanges();
      });

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDestinations(projectID: string, clusterID: string): void {
    this._backupService
      .getDestinations(projectID, clusterID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(destinations => {
        this.destinations = destinations;
      });
  }

  hasDestinations(): boolean {
    return this.destinations?.length > 0;
  }

  getClusterNamespaces(projectID: string, clusterID: string): void {
    this._rbacService
      .getClusterNamespaces(projectID, clusterID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(namespaces => {
        this.nameSpaces = namespaces;
      });
  }

  onLabelsChange(labels: Record<string, string>): void {
    this.labels = labels;
  }

  isCustomBackup(): boolean {
    const res = this.form.get(Controls.Schedule).value === DefaultSchuleOption.Custom;
    return res;
  }

  getObservable(): Observable<ClusterBackup> {
    return this._clusterBackupService.create(this.projectID, this._getClusterBackupConfig());
  }

  onNext(backup: ClusterBackup): void {
    this._dialogRef.close(true);
    this._notificationService.success(`Created the ${backup.name} cluster backup`);
  }

  private _getClusterBackupConfig(): ClusterBackup {

    const backup: ClusterBackup = {
      name: this.form.get(Controls.Name).value,
      spec: {
        destination: this.form.get(Controls.Destination).value,
        clusterid: this.form.get(Controls.Clusters).value,
        namespaces: this.form.get(Controls.NameSpaces).value,
        expiredAt: this.form.get(Controls.ExpiredAt).value,
        labels: this.labels,
      },
    };

    backup.spec[Controls.Schedule] = this.isCustomBackup()
      ? this.form.get(Controls.CronJob).value
      : this.form.get(Controls.Schedule).value;

    return backup;
  }
}
