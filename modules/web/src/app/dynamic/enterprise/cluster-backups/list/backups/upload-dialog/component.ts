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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
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
import {BackupStorageLocation} from '@shared/entity/backup';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

export interface UploadBackupDialogConfig {
  projectID: string;
}

enum BSLListState {
  Ready = 'Backup Storage Location',
  Loading = 'Loading...',
  Empty = 'No Backup Storage Locations Available',
}

enum Controls {
  BSL = 'bsl',
  BackupName = 'backupName',
}

@Component({
  selector: 'km-upload-backups-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class UploadBackupsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _multipartUploadFilePartSize = 15; //MB
  readonly Controls = Controls;
  projectID = this._config.projectID;
  form: FormGroup;
  backupStorageLocations: BackupStorageLocation[];
  backupStorageLocationLabel: BSLListState = BSLListState.Ready;
  selectedBSL: BackupStorageLocation;
  selectedBackupFiles: FileList;
  selectedBackupsDirectory: string;
  selectedKopiaFiles: FileList;
  selectedKopiaDirectory: string;
  backupFilesUploadStatus: Record<string, boolean> = {};
  kopiaFilesUploadStatus: Record<string, boolean> = {};
  isUploading: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: UploadBackupDialogConfig,
    private readonly _dialogRef: MatDialogRef<UploadBackupsDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.BSL]: this._builder.control('', Validators.required),
      [Controls.BackupName]: this._builder.control('', Validators.required),
    });

    this._getCBSL(this._config.projectID);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onBackupsDirectorySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedBackupFiles = input.files;
    this.selectedBackupsDirectory = input.files.length ? input.files[0].webkitRelativePath.split('/')[0] : '';
  }

  onKopiaDirectorySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedKopiaFiles = input.files;
    this.selectedKopiaDirectory = input.files.length ? input.files[0].webkitRelativePath.split('/')[0] : '';
  }

  async onUpload() {
    this._dialogRef.disableClose = true;
    this.isUploading = true;
    const selectedBSL = this.backupStorageLocations.find(bsl => bsl.name === this.form.get(Controls.BSL).value);

    this._clusterBackupService
      .getBackupStorageLocationCredentials(this.projectID, selectedBSL.name)
      .pipe(take(1))
      .subscribe(async credentials => {
        const s3Client = new S3Client({
          region: selectedBSL.spec.config.region,
          credentials,
          forcePathStyle: true,
          endpoint: selectedBSL.spec.config.s3Url,
        });

        const bucketName = selectedBSL.spec.objectStorage.bucket;
        const prefix = selectedBSL.spec.objectStorage.prefix || '';
        const backupDirectoryName = this.form.get(Controls.BackupName).value;
        const bytes = 1024;
        const maxFilePartSizeInBytes = this._multipartUploadFilePartSize * bytes * bytes;

        for (const file of this.selectedBackupFiles) {
          const fileName = file.webkitRelativePath.split('/').slice(1).join('/');
          const key = `${prefix && `${prefix}/`}${this.projectID}/${backupDirectoryName}/backups/${fileName}`;
          let isFileUploaded = false;
          if (file.size > maxFilePartSizeInBytes) {
            isFileUploaded = await this._multiPartFileUpload(file, s3Client, bucketName, key);
          } else {
            isFileUploaded = await this._singleFileUpload(file, s3Client, bucketName, key);
          }
          if (!isFileUploaded) {
            return;
          }
        }

        for (const file of this.selectedKopiaFiles) {
          const fileName = file.webkitRelativePath.split('/').slice(1).join('/');
          const key = `${prefix && `${prefix}/`}${this.projectID}/${backupDirectoryName}/kopia/${fileName}`;
          let isFileUploaded = false;
          if (file.size > maxFilePartSizeInBytes) {
            isFileUploaded = await this._multiPartFileUpload(file, s3Client, bucketName, key);
          } else {
            isFileUploaded = await this._singleFileUpload(file, s3Client, bucketName, key);
          }
          if (!isFileUploaded) {
            return;
          }
        }

        this._notificationService.success('Backups uploaded successfully.');
        this._dialogRef.close();
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

  private async _singleFileUpload(file: File, s3Client: S3Client, bucketName: string, key: string): Promise<boolean> {
    const fileBuffer = await file.arrayBuffer();
    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(fileBuffer),
      })
    );
    return !!response.ETag;
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
      const bytes = 1024;
      const partSizeInBytes = this._multipartUploadFilePartSize * bytes * bytes; // 100 MB
      const numParts = Math.ceil(file.size / partSizeInBytes);

      const maxUploadRequests = 5;

      for (let i = 0; i < numParts; i++) {
        const start = i * partSizeInBytes;
        const end = Math.min(start + partSizeInBytes, file.size);
        const fileSlice = file.slice(start, end);
        const fileBuffer = await fileSlice.arrayBuffer();

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
        }
      }

      if (uploadPromises.length) {
        const responses = await Promise.all(uploadPromises);
        uploadResults.push(...responses);
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
        await s3Client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
          })
        );
      }
      throw error;
    }
  }
}
