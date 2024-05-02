//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2024 Kubermatic GmbH
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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {BackupStorageLocation, CreateBackupStorageLocation, SuportedBSLProviders} from '@app/shared/entity/backup';
import {Observable, Subject} from 'rxjs';

export interface AddBackupStorageLocationDialogConfig {
  projectID: string;
  bslObject: BackupStorageLocation;
}

enum Controls {
  Name = 'name',
  Bucket = 'bucket',
  Prefix = 'prefix',
  CaCert = 'caCert',
  AccessKeyId = 'accessKeyId',
  SecretAccessKey = 'secretAccessKey',
  BackupSyncPeriod = 'backupSyncPeriod',
  Region = 'region',
  Endpoints = 'endpoints',
}

@Component({
  selector: 'km-add-backup-storage-location-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddBackupStorageLocationDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  form: FormGroup;

  get label(): string {
    return this._config.bslObject ? 'Save Changes' : 'Create';
  }

  get icon(): string {
    return this._config.bslObject ? 'km-icon-save' : 'km-icon-add';
  }

  get title(): string {
    return this._config.bslObject ? 'Edit Backup Storage Location' : 'Create Backup Storage Location';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddBackupStorageLocationDialogConfig,
    private readonly _builder: FormBuilder,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _dialogRef: MatDialogRef<AddBackupStorageLocationDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}
  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._config.bslObject?.name ?? '', Validators.required),
      [Controls.Bucket]: this._builder.control(
        this._config.bslObject?.spec.objectStorage.bucket ?? '',
        Validators.required
      ),
      [Controls.Prefix]: this._builder.control(this._config.bslObject?.spec.objectStorage.prefix ?? ''),
      [Controls.CaCert]: this._builder.control(this._config.bslObject?.spec.objectStorage.caCert ?? ''),
      [Controls.AccessKeyId]: this._builder.control(''),
      [Controls.SecretAccessKey]: this._builder.control(''),
      [Controls.BackupSyncPeriod]: this._builder.control(this._config.bslObject?.spec.backupSyncPeriod ?? '0'),
      [Controls.Region]: this._builder.control(this._config.bslObject?.spec.config.region ?? ''),
      [Controls.Endpoints]: this._builder.control(this._config.bslObject?.spec.config.s3Url ?? ''),
    });

    if (this._config.bslObject) {
      this.form.get(Controls.Name).disable();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<BackupStorageLocation> {
    if (this._config.bslObject) {
      return this._clusterBackupService.patchBackupStorageLocation(
        this._config.projectID,
        this._getBackupStorageLocation(),
        this._config.bslObject.name
      );
    }
    return this._clusterBackupService.createBackupStorageLocation(
      this._config.projectID,
      this._getBackupStorageLocation()
    );
  }

  onNext(backupStorageLocation: BackupStorageLocation): void {
    this._dialogRef.close();
    this._notificationService.success(`Created the ${backupStorageLocation.name} backup storage location`);
  }

  private _getBackupStorageLocation(): CreateBackupStorageLocation {
    return {
      name: this.form.get(Controls.Name).value,
      cbslSpec: {
        objectStorage: {
          bucket: this.form.get(Controls.Bucket).value,
          prefix: this.form.get(Controls.Prefix).value,
          caCert: this.form.get(Controls.CaCert).value,
        },
        backupSyncPeriod: this.form.get(Controls.BackupSyncPeriod).value,
        config: {
          region: this.form.get(Controls.Region).value,
          s3Url: this.form.get(Controls.Endpoints).value,
        },
        provider: SuportedBSLProviders.AWS,
      },
      credentials: {
        accessKeyId: this.form.get(Controls.AccessKeyId).value,
        secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
      },
    };
  }
}
