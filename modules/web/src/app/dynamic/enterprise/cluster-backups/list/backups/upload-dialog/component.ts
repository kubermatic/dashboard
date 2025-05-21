//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2025 Kubermatic GmbH
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

import {Component, HostListener, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import {ClusterBackupService} from '@core/services/cluster-backup';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {BackupStorageLocation, BackupStorageLocationCredentials} from '@shared/entity/backup';
import {getEditionVersion} from '@shared/utils/common';
import {Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';

export interface UploadBackupDialogConfig {
  projectID: string;
}

enum BSLListState {
  Ready = 'Backup Storage Location',
  Loading = 'Loading...',
  Empty = 'No Backup Storage Locations Available',
}

enum UploadStatus {
  Success,
  Failure,
  Aborted,
}

enum Controls {
  BSL = 'bsl',
  BackupName = 'backupName',
  BackupsDirectory = 'backupsDirectory',
  KopiaDirectory = 'kopiaDirectory',
}

@Component({
  selector: 'km-upload-backups-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class UploadBackupsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _multipartUploadFilePartSize = 104857600; // 100 MB
  private readonly _maximumFileSizeAllowed = 1099511627776; // 1TB
  readonly backupsDirectoryName = 'backups';
  readonly kopiaDirectoryName = 'kopia';
  readonly Controls = Controls;
  readonly editionVersion: string = getEditionVersion();
  projectID = this._config.projectID;
  form: FormGroup;
  backupStorageLocations: BackupStorageLocation[];
  backupStorageLocationLabel: BSLListState = BSLListState.Ready;
  selectedBackupFiles: FileList;
  selectedBackupsDirectoryName: string;
  selectedKopiaFiles: FileList;
  selectedKopiaDirectoryName: string;
  isUploading: boolean = false;
  isCancelTriggered: boolean = false;
  currentUploadFileName: string;
  totalFilesSize: number = 0;
  uploadedFilesSize: number = 0;
  totalProgress: number = 0;
  errorMessage: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: UploadBackupDialogConfig,
    private readonly _dialogRef: MatDialogRef<UploadBackupsDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.BSL]: this._builder.control('', Validators.required),
      [Controls.BackupName]: this._builder.control('', Validators.required),
      [Controls.BackupsDirectory]: this._builder.control(''),
      [Controls.KopiaDirectory]: this._builder.control(''),
    });

    this._getCBSL(this._config.projectID);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  onWindowClose(event: BeforeUnloadEvent): void {
    if (this.isUploading) {
      event.preventDefault();
    }
  }

  onBackupsDirectorySelected(event: Event): void {
    this.form.get(Controls.BackupsDirectory).setErrors(null);
    this.selectedBackupFiles = null;
    this.selectedBackupsDirectoryName = '';
    const input = event.target as HTMLInputElement;
    for (const file of input.files) {
      if (file.size > this._maximumFileSizeAllowed) {
        this.form.get(Controls.BackupsDirectory).setErrors({fileSize: true});
        return;
      }
    }
    this.selectedBackupFiles = input.files;
    this.selectedBackupsDirectoryName = input.files.length ? input.files[0].webkitRelativePath.split('/')[0] : '';
  }

  onKopiaDirectorySelected(event: Event): void {
    this.form.get(Controls.KopiaDirectory).setErrors(null);
    this.selectedKopiaFiles = null;
    this.selectedKopiaDirectoryName = '';
    const input = event.target as HTMLInputElement;
    for (const file of input.files) {
      if (file.size > this._maximumFileSizeAllowed) {
        this.form.get(Controls.KopiaDirectory).setErrors({fileSize: true});
        return;
      }
    }
    this.selectedKopiaFiles = input.files;
    this.selectedKopiaDirectoryName = input.files.length ? input.files[0].webkitRelativePath.split('/')[0] : '';
  }

  onCancel(): void {
    if (this.isUploading) {
      const dialogConfig: MatDialogConfig = {
        data: {
          title: 'Cancel Backups Upload',
          message:
            "Are you sure you want to cancel backups upload? This action won't remove the files which have finished uploading.",
          confirmLabel: 'Cancel',
        },
      };

      this._matDialog
        .open(ConfirmationDialogComponent, dialogConfig)
        .afterClosed()
        .pipe(filter(isConfirmed => isConfirmed))
        .subscribe(_ => {
          this.isCancelTriggered = true;
        });
    } else {
      this._dialogRef.close();
    }
  }

  async onUpload() {
    this.isUploading = true;
    this._dialogRef.disableClose = true;
    this.form.disable();
    this.errorMessage = '';

    const selectedBSL = this.backupStorageLocations.find(bsl => bsl.name === this.form.get(Controls.BSL).value);

    this._clusterBackupService
      .getBackupStorageLocationCredentials(this.projectID, selectedBSL.name)
      .pipe(take(1))
      .subscribe({
        next: async credentials => {
          const uploadStatus = await this._startUploads(selectedBSL, credentials);
          switch (uploadStatus) {
            case UploadStatus.Success:
              this._notificationService.success('Backups uploaded successfully.');
              this._dialogRef.close();
              return;
            case UploadStatus.Failure:
              this.errorMessage =
                'Upload to S3 failed. Some files may have been uploaded and won’t be removed automatically, please delete them manually from your S3 bucket or retry the upload to overwrite them.';
          }
          this._reset();
        },
        error: _ => {
          this._reset();
        },
      });
  }

  private _getCBSL(projectID: string): void {
    this.backupStorageLocationLabel = BSLListState.Loading;
    this._clusterBackupService
      .listBackupStorageLocation(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cbslList => {
        this.backupStorageLocations = cbslList;
        this.backupStorageLocationLabel = cbslList.length ? BSLListState.Ready : BSLListState.Empty;
      });
  }

  private _reset(): void {
    this.isUploading = false;
    this.isCancelTriggered = false;
    this._dialogRef.disableClose = false;
    this.form.enable();
  }

  private async _startUploads(
    selectedBSL: BackupStorageLocation,
    credentials: BackupStorageLocationCredentials
  ): Promise<UploadStatus> {
    const s3Client = new S3Client({
      region: selectedBSL.spec.config.region,
      credentials,
      forcePathStyle: true,
      endpoint: selectedBSL.spec.config.s3Url,
    });

    this._setTotalFilesSize();
    this.uploadedFilesSize = 0;
    this._updateTotalProgress();

    const bucketName = selectedBSL.spec.objectStorage.bucket;
    const prefix = selectedBSL.spec.objectStorage.prefix || '';
    const backupDirectoryName = this.form.get(Controls.BackupName).value;

    try {
      for (const file of this.selectedBackupFiles) {
        if (this.isCancelTriggered) {
          return UploadStatus.Aborted;
        }
        this.currentUploadFileName = file.webkitRelativePath;
        const fileName = file.webkitRelativePath.split('/').slice(1).join('/');
        const key = `${prefix && `${prefix}/`}${this.projectID}/${backupDirectoryName}/${this.backupsDirectoryName}/${fileName}`;
        let isFileUploaded = false;
        if (file.size > this._multipartUploadFilePartSize) {
          isFileUploaded = await this._multiPartFileUpload(file, s3Client, bucketName, key);
        } else {
          isFileUploaded = await this._singleFileUpload(file, s3Client, bucketName, key);
        }
        if (!isFileUploaded) {
          return UploadStatus.Failure;
        }
      }

      for (const file of this.selectedKopiaFiles) {
        if (this.isCancelTriggered) {
          return UploadStatus.Aborted;
        }
        this.currentUploadFileName = file.webkitRelativePath;
        const fileName = file.webkitRelativePath.split('/').slice(1).join('/');
        const key = `${prefix && `${prefix}/`}${this.projectID}/${backupDirectoryName}/${this.kopiaDirectoryName}/${fileName}`;
        let isFileUploaded = false;
        if (file.size > this._multipartUploadFilePartSize) {
          isFileUploaded = await this._multiPartFileUpload(file, s3Client, bucketName, key);
        } else {
          isFileUploaded = await this._singleFileUpload(file, s3Client, bucketName, key);
        }
        if (!isFileUploaded) {
          return UploadStatus.Failure;
        }
      }

      return UploadStatus.Success;
    } catch (_) {
      return UploadStatus.Failure;
    }
  }

  private async _singleFileUpload(file: File, s3Client: S3Client, bucketName: string, key: string): Promise<boolean> {
    const fileBuffer = await file.arrayBuffer();
    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(fileBuffer),
      })
    );
    if (response.ETag) {
      this.uploadedFilesSize += file.size;
      this._updateTotalProgress();
      return true;
    }
    return false;
  }

  private async _multiPartFileUpload(
    file: File,
    s3Client: S3Client,
    bucketName: string,
    key: string
  ): Promise<boolean> {
    let uploadId;
    try {
      const multipartUpload = await s3Client.send(
        new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
        })
      );

      uploadId = multipartUpload.UploadId;

      const uploadResults = [];
      let uploadPromises = [];
      const numParts = Math.ceil(file.size / this._multipartUploadFilePartSize);

      const maxUploadRequests = 5;
      let uploadedPartsTotalSize = 0;

      for (let i = 0; i < numParts; i++) {
        const start = i * this._multipartUploadFilePartSize;
        const end = Math.min(start + this._multipartUploadFilePartSize, file.size);
        const fileSlice = file.slice(start, end);
        const fileBuffer = await fileSlice.arrayBuffer();
        uploadedPartsTotalSize += end - start;

        uploadPromises.push(
          s3Client
            .send(
              new UploadPartCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
                Body: new Uint8Array(fileBuffer),
                PartNumber: i + 1,
              })
            )
            .then(d => d)
        );

        if (uploadPromises.length === maxUploadRequests) {
          const responses = await Promise.all(uploadPromises);
          uploadResults.push(...responses);
          uploadPromises = [];
          this.uploadedFilesSize += uploadedPartsTotalSize;
          this._updateTotalProgress();
          uploadedPartsTotalSize = 0;
        }
        if (this.isCancelTriggered) {
          await this._abortMultipartUpload(s3Client, bucketName, key, uploadId);
          return true;
        }
      }

      if (uploadPromises.length) {
        const responses = await Promise.all(uploadPromises);
        uploadResults.push(...responses);
        this.uploadedFilesSize += uploadedPartsTotalSize;
        this._updateTotalProgress();
      }

      await s3Client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: uploadResults.map(({ETag}, i) => ({
              ETag,
              PartNumber: i + 1,
            })),
          },
        })
      );

      return true;
    } catch (error) {
      if (uploadId) {
        await this._abortMultipartUpload(s3Client, bucketName, key, uploadId);
      }
      return false;
    }
  }

  private _abortMultipartUpload(s3Client: S3Client, bucketName: string, key: string, uploadId: string) {
    return s3Client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
      })
    );
  }

  private _setTotalFilesSize(): void {
    this.totalFilesSize = 0;
    for (const file of this.selectedBackupFiles) {
      this.totalFilesSize += file.size;
    }
    for (const file of this.selectedKopiaFiles) {
      this.totalFilesSize += file.size;
    }
  }

  private _updateTotalProgress(): void {
    if (this.totalFilesSize > 0) {
      const maxPercentage = 100;
      this.totalProgress = Math.floor((this.uploadedFilesSize / this.totalFilesSize) * maxPercentage);
    } else {
      this.totalProgress = 0;
    }
  }
}
