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

import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {
  CustomImageDialogData,
  KubeVirtCustomImageDialogComponent,
} from '@shared/components/kubevirt-custom-images/custom-image-dialog/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {KubeVirtPreAllocatedDataVolume, KubeVirtPreAllocatedDataVolumeAnnotation} from '@shared/entity/cluster';
import {KubeVirtStorageClass} from '@shared/entity/provider/kubevirt';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {filter, take} from 'rxjs/operators';

enum Column {
  Name = 'name',
  Size = 'size',
  StorageClass = 'storageClass',
  OS = 'os',
  Actions = 'actions',
}

@Component({
  selector: 'km-kubevirt-custom-images',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtCustomImagesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeVirtCustomImagesComponent),
      multi: true,
    },
  ],
})
export class KubeVirtCustomImagesComponent extends BaseFormValidator implements OnInit, OnChanges, OnDestroy {
  readonly Column = Column;
  readonly displayedColumns: string[] = Object.values(Column);

  @Input() customImages: KubeVirtPreAllocatedDataVolume[] = [];
  @Input() storageClasses: KubeVirtStorageClass[] = [];
  @Output() customImagesChange = new EventEmitter<KubeVirtPreAllocatedDataVolume[]>();

  dataSource = new MatTableDataSource<KubeVirtPreAllocatedDataVolume>();

  constructor(private readonly _matDialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.dataSource.data = this.customImages;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.customImages) {
      this.dataSource.data = changes.customImages.currentValue || [];
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getOS(customImage: KubeVirtPreAllocatedDataVolume): string {
    return customImage.annotations?.[KubeVirtPreAllocatedDataVolumeAnnotation.OSType];
  }

  getSizeNumber(size: string): string {
    return size.match(/\d+/)[0];
  }

  addCustomImage() {
    const dialogConfig: MatDialogConfig = {
      data: {
        storageClasses: this.storageClasses,
        customImagesList: this.customImages,
      } as CustomImageDialogData,
    };
    const dialogRef = this._matDialog.open(KubeVirtCustomImageDialogComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(filter(data => !!data))
      .pipe(take(1))
      .subscribe((customImage: KubeVirtPreAllocatedDataVolume) => {
        this.customImages = [...this.customImages, customImage];
        this.customImagesChange.emit(this.customImages);
      });
  }

  editCustomImage(customImage: KubeVirtPreAllocatedDataVolume): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        storageClasses: this.storageClasses,
        customImage,
        customImagesList: this.customImages.filter(image => image.name !== customImage.name),
      } as CustomImageDialogData,
    };
    const dialogRef = this._matDialog.open(KubeVirtCustomImageDialogComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(filter(data => !!data))
      .pipe(take(1))
      .subscribe((updatedCustomImage: KubeVirtPreAllocatedDataVolume) => {
        this.customImages = this.customImages.map(image => {
          if (image.name === customImage.name) {
            return updatedCustomImage;
          }
          return image;
        });
        this.customImagesChange.emit(this.customImages);
      });
  }

  deleteCustomImage(customImage: KubeVirtPreAllocatedDataVolume): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Custom Image',
        message: `Delete <b>${customImage.name}</b> custom image permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(take(1))
      .subscribe(() => {
        this.customImages = this.customImages.filter(image => image.name !== customImage.name);
        this.customImagesChange.emit(this.customImages);
      });
  }
}
