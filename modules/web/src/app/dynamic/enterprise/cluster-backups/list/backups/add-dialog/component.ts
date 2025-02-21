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
  BackupStorageLocationTempName,
  BackupType,
  ClusterBackup,
  CreateClusterBackupSchedule,
} from '@app/shared/entity/backup';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {KmValidators} from '@app/shared/validators/validators';
import {Cluster} from '@app/shared/entity/cluster';
import {Cluster_BACKUP_EXPIRES_IN, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';

export interface AddClustersBackupsDialogConfig {
  projectID: string;
  type: BackupType;
  cluster: Cluster;
  clusterBSL: string;
}

enum Controls {
  Name = 'name',
  Destination = 'destination',
  AllNamespaces = 'allNamespaces',
  Namespaces = 'namespaces',
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
    standalone: false
})
export class AddClustersBackupsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  type: BackupType = this._config.type;
  projectID = this._config.projectID;
  cluster = this._config.cluster;
  cbslName = this._config.clusterBSL;
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
    this._getCbslName();
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Destination]: this._builder.control(this.cbslName, Validators.required),
      [Controls.AllNamespaces]: this._builder.control(true),
      [Controls.Namespaces]: this._builder.control([]),
      [Controls.DefaultVolumesToFsBackup]: this._builder.control(true),
      [Controls.CronJob]: this._builder.control(''),
      [Controls.ExpiresIn]: this._builder.control('', Cluster_BACKUP_EXPIRES_IN),
      [Controls.Labels]: this._builder.control(''),
    });

    // this field for now will be disable until we have a list of BSL
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

    this.form
      .get(Controls.AllNamespaces)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const namespacesControl = this.form.get(Controls.Namespaces);
        if (value) {
          namespacesControl.clearValidators();
        } else {
          namespacesControl.setValidators(Validators.required);
        }
        namespacesControl.updateValueAndValidity();
      });
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

  private _getCbslName(): void {
    // This method returns the name of the CBSL in the seed cluster that was used during cluster creation.
    const cbslNameArr = this.cluster.spec.backupConfig.backupStorageLocation.name.split('-');
    cbslNameArr.pop();
    this.cbslName = cbslNameArr.join('-');
  }

  private _getClusterBackupConfig(): ClusterBackup {
    const backup: ClusterBackup = {
      name: this.form.get(Controls.Name).value,
      spec: {
        storageLocation: BackupStorageLocationTempName,
        clusterid: this.cluster.id,
        defaultVolumesToFsBackup: this.form.get(Controls.DefaultVolumesToFsBackup).value,
      },
    };

    if (this.form.get(Controls.AllNamespaces).value) {
      delete backup.spec?.includedNamespaces;
    } else {
      backup.spec.includedNamespaces = this.form.get(Controls.Namespaces).value;
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
          storageLocation: BackupStorageLocationTempName,
          clusterid: this.cluster.id,
          defaultVolumesToFsBackup: this.form.get(Controls.DefaultVolumesToFsBackup).value,
        },
      },
    };

    if (this.form.get(Controls.AllNamespaces).value) {
      delete scheduleBackup.spec?.template.includedNamespaces;
    } else {
      scheduleBackup.spec.template.includedNamespaces = this.form.get(Controls.Namespaces).value;
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
