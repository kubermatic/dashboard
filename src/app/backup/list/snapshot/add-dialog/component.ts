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
import {Router} from '@angular/router';
import {BackupService} from '@core/services/backup';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {UserService} from '@core/services/user';
import {NotificationService} from '@core/services/notification';
import {EtcdBackupConfig, EtcdBackupConfigSpec} from '@shared/entity/backup';
import {Cluster} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

export interface AddSnapshotDialogConfig {
  projectID: string;
}

enum Controls {
  Cluster = 'cluster',
  Name = 'name',
  Destination = 'destination',
}

@Component({
  selector: 'km-add-snapshot-dialog',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class AddSnapshotDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  clusters: Cluster[] = [];
  destinations: string[] = [];
  seed = '';
  isAdmin = false;
  form: FormGroup;

  private _selectedClusterID(): string {
    return this.form.get(Controls.Cluster).value;
  }

  constructor(
    private readonly _dialogRef: MatDialogRef<AddSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddSnapshotDialogConfig,
    private readonly _clusterService: ClusterService,
    private readonly _backupService: BackupService,
    private readonly _builder: FormBuilder,
    private readonly _notificationService: NotificationService,
    private readonly _datacenterService: DatacenterService,
    private readonly _userService: UserService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Cluster]: this._builder.control('', Validators.required),
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Destination]: this._builder.control('', Validators.required),
    });

    this._clusterService
      .clusters(this._config.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));

    this._userService.currentUser.subscribe(user => (this.isAdmin = user.isAdmin));

    this.form
      .get(Controls.Cluster)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onClusterChange.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasClusterInput(): boolean {
    return !!this.form.get(Controls.Cluster).value;
  }

  goToBackupDestinations(): void {
    this._router.navigateByUrl('/settings/backupdestinations');
    this._dialogRef.close(true);
  }

  save(): void {
    this._backupService
      .create(this._config.projectID, this._selectedClusterID(), this._toEtcdBackupConfig())
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Created the ${this._toEtcdBackupConfig().name} snapshot`);
        this._dialogRef.close(true);
      });
  }

  private _onClusterChange(clusterID: string) {
    const matchingCluster = this.clusters.find(cluster => cluster.id === clusterID);
    if (matchingCluster) {
      this._datacenterService
        .getDatacenter(matchingCluster.spec.cloud.dc)
        .pipe(take(1))
        .subscribe(dc => (this.seed = dc.spec.seed));
    }

    this._backupService
      .getDestinations(this._config.projectID, clusterID)
      .pipe(take(1))
      .subscribe(destinations => (this.destinations = destinations));
  }

  private _toEtcdBackupConfig(): EtcdBackupConfig {
    return {
      name: this.form.get(Controls.Name).value,
      spec: {
        clusterId: this._selectedClusterID(),
        destination: this.form.get(Controls.Destination).value,
      } as EtcdBackupConfigSpec,
    } as EtcdBackupConfig;
  }
}
