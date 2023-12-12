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
import {BackupService} from '@core/services/backup';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {ClusterService} from '@core/services/cluster';
import {Observable, Subject, takeUntil} from 'rxjs';
import {RBACService} from '@core/services/rbac';
import {
  BackupType,
  ClusterBackup,
  CreateClusterBackupSchedule,
  StorageLocationTempName,
} from '@app/shared/entity/backup';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {KmValidators} from '@app/shared/validators/validators';

enum Controls {
  Name = 'name',
  Clusters = 'clusters',
  Destination = 'destination',
  NameSpaces = 'namespaces',
  CronJob = 'cronjob',
  ExpiredAt = 'ttl',
  Labels = 'labels',
}

@Component({
  selector: 'km-add-cluster-backups-dialog-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddClustersBackupsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly type: BackupType = this._config.type;
  projectID = this._config.projectID;
  clusters: Cluster[] = [];
  destinations: string[] = [];
  isAdmin = false;
  nameSpaces: string[] = [];
  labels: Record<string, string>;

  readonly Controls = Controls;
  form: FormGroup;

  get label(): string {
    return `Create ${this.type}`;
  }

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
      [Controls.NameSpaces]: this._builder.control([]),
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

  isScheduleBackup(): boolean {
    return this.type === BackupType.Schedule;
  }

  getObservable(): Observable<ClusterBackup | CreateClusterBackupSchedule> {
    if (this.type === BackupType.Backup) {
      return this._clusterBackupService.create(this.projectID, this._getClusterBackupConfig());
    }
    return this._clusterBackupService.createSchedule(this.projectID, this._getClusterScheduleBackupConfig());
  }

  onNext(backup: ClusterBackup): void {
    this._dialogRef.close(true);
    this._notificationService.success(`Created the ${backup.name} ${this.type}`);
  }

  private _getClusterBackupConfig(): ClusterBackup {
    const backup: ClusterBackup = {
      name: this.form.get(Controls.Name).value,
      spec: {
        storageLocation: StorageLocationTempName,
        clusterid: this.form.get(Controls.Clusters).value,
      },
    };

    if (this.form.get(Controls.NameSpaces).value.length) {
      backup.spec.includedNamespaces = this.form.get(Controls.NameSpaces).value;
    }

    if (this.labels) {
      backup.spec.labelSelector = {
        matchLabels: this.labels,
      };
    }

    if (this.form.get(Controls.ExpiredAt).value) {
      backup.spec[Controls.ExpiredAt] = this.form.get(Controls.ExpiredAt).value;
    }

    return backup;
  }
  private _getClusterScheduleBackupConfig(): CreateClusterBackupSchedule {
    const scheduleBackup: CreateClusterBackupSchedule = {
      name: this.form.get(Controls.Name).value,
      spec: {
        schedule: this.form.get(Controls.CronJob).value,
        template: {
          includedNamespaces: this.form.get(Controls.NameSpaces).value,
          storageLocation: StorageLocationTempName,
          clusterid: this.form.get(Controls.Clusters).value,
        },
      },
    };

    if (this.labels) {
      scheduleBackup.spec.template.labelSelector = {
        matchLabels: this.labels,
      };
    }

    if (this.form.get(Controls.ExpiredAt).value) {
      scheduleBackup.spec.template[Controls.ExpiredAt] = this.form.get(Controls.ExpiredAt).value;
    }
    return scheduleBackup;
  }
}
