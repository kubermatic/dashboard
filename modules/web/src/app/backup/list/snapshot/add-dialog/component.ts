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
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {BackupService} from '@core/services/backup';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {EtcdBackupConfig, EtcdBackupConfigSpec} from '@shared/entity/backup';
import {Cluster} from '@shared/entity/cluster';
import {EMPTY, iif, Observable, Subject} from 'rxjs';
import {switchMap, take, takeUntil, tap} from 'rxjs/operators';

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
})
export class AddSnapshotDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  clusters: Cluster[] = [];
  destinations: string[] = [];
  seed = '';
  isAdmin = false;
  form: FormGroup;
  isLoadingDestinations = false;

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
    private readonly _userService: UserService
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

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));

    this.form
      .get(Controls.Cluster)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onClusterChange.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasDestinations(): boolean {
    return this.destinations?.length > 0;
  }

  getObservable(): Observable<EtcdBackupConfig> {
    return this._backupService
      .create(this._config.projectID, this._selectedClusterID(), this._toEtcdBackupConfig())
      .pipe(take(1));
  }

  onNext(): void {
    this._notificationService.success(`Created the ${this._toEtcdBackupConfig().name} snapshot`);
    this._dialogRef.close(true);
  }

  private _onClusterChange(clusterID: string) {
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
        clusterId: this._selectedClusterID(),
        destination: this.form.get(Controls.Destination).value,
      } as EtcdBackupConfigSpec,
    } as EtcdBackupConfig;
  }
}
