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
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {
  BackupStorageLocation,
  BackupStorageLocationConfig,
  BackupStorageLocationSpec,
  CreateBackupStorageLocation,
  DefaultVeleroChecksumAlgorithm,
  SupportedBSLProviders,
  VeleroChecksumAlgorithm,
} from '@app/shared/entity/backup';
import {CBSL_SYNC_PERIOD, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {SettingsService} from '@core/services/settings';
import * as y from 'js-yaml';
import {Observable, Subject, takeUntil} from 'rxjs';

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
  ChecksumAlgorithm = 'checksumAlgorithm',
  AddCustomConfig = 'addCustomConfig',
}

@Component({
  selector: 'km-add-backup-storage-location-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class AddBackupStorageLocationDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _dnsLabelRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  readonly Controls = Controls;
  readonly veleroChecksumAlgorithms = Object.values(VeleroChecksumAlgorithm);
  form: FormGroup;
  valuesConfig = '';
  isYamlEditorValid = true;

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
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}
  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._config.bslObject?.name ?? '', [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Controls.Bucket]: this._builder.control(
        this._config.bslObject?.spec.objectStorage.bucket ?? '',
        Validators.required
      ),
      [Controls.Prefix]: this._builder.control(this._config.bslObject?.spec.objectStorage?.prefix ?? ''),
      [Controls.CaCert]: this._builder.control(this._config.bslObject?.spec.objectStorage?.caCert ?? ''),
      [Controls.AccessKeyId]: this._builder.control(''),
      [Controls.SecretAccessKey]: this._builder.control(''),
      [Controls.BackupSyncPeriod]: this._builder.control(
        this._config.bslObject?.spec.backupSyncPeriod ?? '0',
        CBSL_SYNC_PERIOD
      ),
      [Controls.Region]: this._builder.control(this._config.bslObject?.spec.config?.region ?? '', [
        Validators.required,
        this._dnsNameValidator(),
      ]),
      [Controls.Endpoints]: this._builder.control(this._config.bslObject?.spec.config?.s3Url ?? '', [
        Validators.required,
        this._endpointURLValidator(),
      ]),
      [Controls.ChecksumAlgorithm]: this._builder.control(this._config.bslObject?.spec.config?.checksumAlgorithm ?? ''),
      [Controls.AddCustomConfig]: this._builder.control(false),
    });

    if (this._config.bslObject) {
      this.form.get(Controls.Name).disable();
    } else {
      this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
        if (settings.clusterBackupOptions) {
          this.form
            .get(Controls.ChecksumAlgorithm)
            .setValue(settings.clusterBackupOptions.defaultChecksumAlgorithm ?? DefaultVeleroChecksumAlgorithm);
        } else if (!this.form.get(Controls.ChecksumAlgorithm).value) {
          this.form.get(Controls.ChecksumAlgorithm).setValue(DefaultVeleroChecksumAlgorithm);
        }
      });
    }

    this.form
      .get(Controls.AddCustomConfig)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((value: boolean) => {
        let config: BackupStorageLocationConfig;
        if (this._config.bslObject?.name) {
          config = this._config.bslObject.spec.config;
        } else {
          config = {
            region: this.form.get(Controls.Region).value,
            s3Url: this.form.get(Controls.Endpoints).value?.trim(),
            checksumAlgorithm: this.form.get(Controls.ChecksumAlgorithm).value,
          };
        }
        try {
          this.valuesConfig = y.dump({config: config});
        } catch (error) {
          this.isYamlEditorValid = false;
        }
        if (!value) {
          this.isYamlEditorValid = true;
        }
      });
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
    this._notificationService.success(
      `${this._config?.bslObject?.name ? 'Edited' : 'Created'} the ${backupStorageLocation.name} backup storage location`
    );
  }

  isValidYaml(valid: boolean): void {
    this.isYamlEditorValid = valid;
  }

  private _getBackupStorageLocation(): CreateBackupStorageLocation {
    const bsl = {
      name: this.form.get(Controls.Name).value,
      cbslSpec: {
        objectStorage: {
          bucket: this.form.get(Controls.Bucket).value,
          prefix: this.form.get(Controls.Prefix).value,
          caCert: this.form.get(Controls.CaCert).value,
        },
        backupSyncPeriod:
          this.form.get(Controls.BackupSyncPeriod).value === '' ? null : this.form.get(Controls.BackupSyncPeriod).value,
        config: {
          region: this.form.get(Controls.Region).value,
          s3Url: this.form.get(Controls.Endpoints).value?.trim(),
          checksumAlgorithm: this.form.get(Controls.ChecksumAlgorithm).value || '',
        },
        provider: SupportedBSLProviders.AWS,
      } as BackupStorageLocationSpec,
      credentials: {
        accessKeyId: this.form.get(Controls.AccessKeyId).value,
        secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
      },
    };

    if (this.form.get(Controls.AddCustomConfig).value) {
      try {
        const yaml = y.load(this.valuesConfig) as any;
        bsl.cbslSpec.config = yaml?.config;
      } catch (error) {
        this.isYamlEditorValid = false;
      }
    }
    return bsl;
  }

  private _dnsNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();
      if (!value) {
        return null;
      }

      const labels = value.split('.');
      return labels.every(label => this._dnsLabelRegex.test(label)) ? null : {invalidDnsName: true};
    };
  }

  private _endpointURLValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();
      if (!value) {
        return null;
      }

      if (!/^https?:\/\//i.test(value)) {
        return {invalidEndpointUrl: true};
      }

      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return {invalidEndpointUrl: true};
        }

        if (!url.hostname) {
          return {invalidEndpointUrl: true};
        }

        const labels = url.hostname.split('.');
        return labels.every(label => this._dnsLabelRegex.test(label)) ? null : {invalidEndpointUrl: true};
      } catch {
        return {invalidEndpointUrl: true};
      }
    };
  }
}
