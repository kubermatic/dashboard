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

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterService} from '@app/core/services/cluster';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {ClusterRestore} from '@app/shared/entity/backup';
import {Cluster} from '@app/shared/entity/cluster';
import {CookieService} from 'ngx-cookie-service';
import {Observable, Subject, takeUntil} from 'rxjs';

enum Controls {
  Name = 'name',
  Clusters = 'clusters',
  NameSpaces = 'namespaces',
}

@Component({
  selector: 'km-add-dialog',
  templateUrl: './template.html',
})
export class AddRestoreDialogComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  data: any;
  form: FormGroup;
  controls = Controls;
  clusters: Cluster[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddRestoreDialogComponent,
    private readonly _dialogRef: MatDialogRef<AddRestoreDialogComponent>,
    private readonly _builder: FormBuilder,
    readonly _cookieService: CookieService,
    private readonly _clusterService: ClusterService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.data = this._config;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Clusters]: this._builder.control('', Validators.required),
      [Controls.NameSpaces]: this._builder.control('', Validators.required),
    });

    this._clusterService
      .clusters(this.data.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));
  }

  getObservable(): Observable<ClusterRestore> {
    return this._clusterBackupService.createRestore(this.data.projectID, this._getClusterRestoreConfig());
  }

  onNext(restore: ClusterRestore): void {
    this._dialogRef.close(true);
    const clusterName = this.clusters.find(cluster => cluster.id === restore.spec.clusterid).name;
    this._notificationService.success(`Restore the ${restore.name} for cluster ${clusterName}`);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getClusterRestoreConfig(): ClusterRestore {
    const restore: ClusterRestore = {
      name: this.form.controls[Controls.Name].value,
      spec: {
        namespaces: this.form.controls[Controls.NameSpaces].value,
        clusterid: this.form.controls[Controls.Clusters].value,
        backupName: this.data.backup.name,
        restoredResources: this.form.controls[Controls.NameSpaces].value,
        resources: this.data.backup.spec.namespaces,
      },
    };
    return restore;
  }
}
