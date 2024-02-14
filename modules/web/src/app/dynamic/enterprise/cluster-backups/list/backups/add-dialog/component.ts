//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {UserService} from '@core/services/user';
import {Observable, Subject, takeUntil} from 'rxjs';
import {RBACService} from '@core/services/rbac';
import {
  BackupType,
  ClusterBackup,
  CreateClusterBackupSchedule,
  BackupStorageLocationTempName,
} from '@app/shared/entity/backup';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {KmValidators} from '@app/shared/validators/validators';
import {Cluster} from '@app/shared/entity/cluster';

export interface AddClustersBackupsDialogConfig {
  projectID: string;
  type: BackupType;
  cluster: Cluster;
}

enum Controls {
  Name = 'name',
  Destination = 'destination',
  NameSpaces = 'namespaces',
  DefaultVolumesToFsBackup = 'defaultVolumesToFsBackup',
  CronJob = 'cronjob',
  ExpiresIn = 'ttl',
  Labels = 'labels',
}

enum NamespacesState {
  Ready = 'Namespaces',
  Loading = 'Loading...',
  Empty = 'No Namespaces Available',
}

@Component({
  selector: 'km-add-cluster-backups-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddClustersBackupsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  type: BackupType = this._config.type;
  projectID = this._config.projectID;
  cluster = this._config.cluster;
  destinations: string[] = [];
  isAdmin = false;
  nameSpaces: string[] = [];
  labels: Record<string, string>;
  namespacesLabel = NamespacesState.Ready;

  readonly Controls = Controls;
  form: FormGroup;

  get btnLabel(): string {
    return `Create ${this.type}`;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddClustersBackupsDialogConfig,
    private readonly _dialogRef: MatDialogRef<AddClustersBackupsDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _userService: UserService,
    private readonly _rbacService: RBACService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Destination]: this._builder.control(BackupStorageLocationTempName, Validators.required),
      [Controls.NameSpaces]: this._builder.control([]),
      [Controls.DefaultVolumesToFsBackup]: this._builder.control(true),
      [Controls.CronJob]: this._builder.control(''),
      [Controls.ExpiresIn]: this._builder.control(''),
      [Controls.Labels]: this._builder.control(''),
    });

    // this feild for now will be disable untill we have a list of BSL
    this.form.get(Controls.Destination).disable();
    this.getClusterNamespaces(this.projectID, this.cluster.id);

    const cronJobControl = this.form.get(Controls.CronJob);
    if (this.type === BackupType.Schedule) {
      cronJobControl.enable();
      cronJobControl.setValidators([Validators.required, KmValidators.cronExpression()]);
    } else {
      cronJobControl.disable();
      cronJobControl.clearValidators();
    }
    this._cdr.detectChanges();

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getClusterNamespaces(projectID: string, clusterID: string): void {
    this.namespacesLabel = NamespacesState.Loading;
    this._rbacService
      .getClusterNamespaces(projectID, clusterID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(namespaces => {
        this.nameSpaces = namespaces;
        this.namespacesLabel = namespaces.length ? NamespacesState.Ready : NamespacesState.Empty;
      });
  }

  onLabelsChange(labels: Record<string, string>): void {
    this.labels = labels;
  }

  isScheduleBackup(): boolean {
    return this.type === BackupType.Schedule;
  }

  getObservable(): Observable<ClusterBackup | CreateClusterBackupSchedule> {
    if (this.type === BackupType.Backup) {
      return this._clusterBackupService.create(this.projectID, this.cluster.id, this._getClusterBackupConfig());
    }
    return this._clusterBackupService.createSchedule(
      this.projectID,
      this.cluster.id,
      this._getClusterScheduleBackupConfig()
    );
  }

  onNext(backup: ClusterBackup): void {
    this._dialogRef.close(true);
    this._notificationService.success(`Created the ${backup.name} ${this.type}`);
  }

  private _getClusterBackupConfig(): ClusterBackup {
    const backup: ClusterBackup = {
      name: this.form.get(Controls.Name).value,
      spec: {
        storageLocation: this.form.get(Controls.Destination).value,
        clusterid: this.cluster.id,
        defaultVolumesToFsBackup: this.form.get(Controls.DefaultVolumesToFsBackup).value,
      },
    };

    if (this.form.get(Controls.NameSpaces).value.length) {
      backup.spec.includedNamespaces = this.form.get(Controls.NameSpaces).value;
    } else {
      backup.spec.includedNamespaces = this.nameSpaces;
    }

    if (this.labels) {
      backup.spec.labelSelector = {
        matchLabels: this.labels,
      };
    }

    if (this.form.get(Controls.ExpiresIn).value) {
      backup.spec[Controls.ExpiresIn] = this.form.get(Controls.ExpiresIn).value;
    }
    return backup;
  }
  private _getClusterScheduleBackupConfig(): CreateClusterBackupSchedule {
    const scheduleBackup: CreateClusterBackupSchedule = {
      name: this.form.get(Controls.Name).value,
      spec: {
        schedule: this.form.get(Controls.CronJob).value,
        template: {
          storageLocation: this.form.get(Controls.Destination).value,
          clusterid: this.cluster.id,
          defaultVolumesToFsBackup: this.form.get(Controls.DefaultVolumesToFsBackup).value,
        },
      },
    };

    if (this.form.get(Controls.NameSpaces).value.length) {
      scheduleBackup.spec.template.includedNamespaces = this.form.get(Controls.NameSpaces).value;
    } else {
      scheduleBackup.spec.template.includedNamespaces = this.nameSpaces;
    }

    if (this.labels) {
      scheduleBackup.spec.template.labelSelector = {
        matchLabels: this.labels,
      };
    }

    if (this.form.get(Controls.ExpiresIn).value) {
      scheduleBackup.spec.template[Controls.ExpiresIn] = this.form.get(Controls.ExpiresIn).value;
    }
    return scheduleBackup;
  }
}
