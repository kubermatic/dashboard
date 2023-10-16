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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BackupService} from '@core/services/backup';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {ClusterService} from '@core/services/cluster';
import {Subject, takeUntil} from 'rxjs';
import {RBACService} from '@core/services/rbac';
import {CookieService} from 'ngx-cookie-service';

enum Controls {
  Name = 'name',
  Clusters = 'clusters',
  Destination = 'destination',
  NameSpaces = 'namespaces',
  Schedule = 'schedule',
  CronJob = 'cronjob',
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
    private readonly _cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Destination]: this._builder.control('', Validators.required),
      [Controls.Clusters]: this._builder.control('', Validators.required),
      [Controls.NameSpaces]: this._builder.control('', Validators.required),
      [Controls.Schedule]: this._builder.control('Now', Validators.required),
      [Controls.Labels]: this._builder.control(''),
      [Controls.CronJob]: this._builder.control(''),
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

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {});
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

  createBackup(): void {
    const backup = {
      name: this.form.get(Controls.Name).value,
      destination: this.form.get(Controls.Destination).value,
      cluster: this.form.get(Controls.Clusters).value,
      namespaces: this.form.get(Controls.NameSpaces).value,
      time: new Date().toISOString(),
      // fix the labels, add as a record<key,value> not as an array of <key,value>
      labels: this.form.get(Controls.Labels).value,
    };
    backup[Controls.Schedule] = this.isCustomBackup()
      ? this.form.get(Controls.CronJob).value
      : this.form.get(Controls.Schedule).value;
    const backups = JSON.parse(this._cookieService.get('backup') || '[]');
    backups.push(backup);
    this._cookieService.set('backup', JSON.stringify(backups));
    this._dialogRef.close(true);
  }
}
