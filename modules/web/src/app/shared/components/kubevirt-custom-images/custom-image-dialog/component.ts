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
import {AbstractControl, FormBuilder, ValidatorFn, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {KubeVirtPreAllocatedDataVolume, KubeVirtPreAllocatedDataVolumeAnnotation} from '@shared/entity/cluster';
import {KubeVirtStorageClass} from '@shared/entity/provider/kubevirt';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR, URL_PATTERN_VALIDATOR} from '@shared/validators/others';
import _ from 'lodash';

export interface CustomImageDialogData {
  storageClasses: KubeVirtStorageClass[];
  customImage?: KubeVirtPreAllocatedDataVolume;
  customImagesList: KubeVirtPreAllocatedDataVolume[];
}

enum Controls {
  Name = 'name',
  Size = 'size',
  StorageClass = 'storageClass',
  OS = 'os',
  Url = 'url',
}

enum StorageClassState {
  Ready = 'Storage Class',
  Empty = 'No Storage Classes Available',
}

@Component({
  selector: 'km-custom-image-dialog',
  templateUrl: './template.html',
})
export class KubeVirtCustomImageDialogComponent extends BaseFormValidator implements OnInit {
  readonly Controls = Controls;
  readonly supportedOS = [
    OperatingSystem.Ubuntu,
    OperatingSystem.CentOS,
    OperatingSystem.Flatcar,
    OperatingSystem.RHEL,
    OperatingSystem.RockyLinux,
  ];

  storageClasses: KubeVirtStorageClass[] = [];
  storageClassLabel = StorageClassState.Empty;
  selectedStorageClass: string;
  isEditMode: boolean;

  private readonly _defaultPreAllocatedDataVolumeSize = 10;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CustomImageDialogData,
    private readonly _dialogRef: MatDialogRef<KubeVirtCustomImageDialogComponent>,
    private readonly _builder: FormBuilder
  ) {
    super('Custom Image Dialog Form');
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.customImage;
    this.storageClasses = this.data.storageClasses;
    this.storageClassLabel = !_.isEmpty(this.storageClasses) ? StorageClassState.Ready : StorageClassState.Empty;

    this._initForm();
  }

  onStorageClassChange(value: string): void {
    this.selectedStorageClass = value;
  }

  resetOS(): void {
    this.form.get(Controls.OS).reset();
  }

  onSaveChanges(): void {
    this._dialogRef.close(this._getPreAllocatedDataVolume());
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this.data.customImage?.name || '', [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
        this._duplicateNameValidator(),
      ]),
      [Controls.Size]: this._builder.control(
        this.data.customImage?.size || this._defaultPreAllocatedDataVolumeSize,
        Validators.required
      ),
      [Controls.StorageClass]: this._builder.control(this.data.customImage?.storageClass || '', Validators.required),
      [Controls.OS]: this._builder.control(
        this.data.customImage?.annotations?.[KubeVirtPreAllocatedDataVolumeAnnotation.OSType] || ''
      ),
      [Controls.Url]: this._builder.control(this.data.customImage?.url || '', [
        Validators.required,
        URL_PATTERN_VALIDATOR,
      ]),
    });

    this.selectedStorageClass = this.form.get(Controls.StorageClass).value;
  }

  private _duplicateNameValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const name = control.value;
      if (!name) {
        return null;
      }
      const matchingApplication = this.data.customImagesList?.find(customImage => customImage.name === name);

      return matchingApplication ? {duplicate: true} : null;
    };
  }

  private _getPreAllocatedDataVolume(): KubeVirtPreAllocatedDataVolume {
    const data = {
      name: this.form.get(Controls.Name).value,
      size: `${+this.form.get(Controls.Size).value}Gi`,
      storageClass: this.selectedStorageClass,
      url: this.form.get(Controls.Url).value,
      annotations: this.data.customImage?.annotations || null,
    } as KubeVirtPreAllocatedDataVolume;

    const os = this.form.get(Controls.OS).value;
    if (os) {
      data.annotations = {
        ...(data.annotations || {}),
        [KubeVirtPreAllocatedDataVolumeAnnotation.OSType]: os,
      };
    } else if (data.annotations) {
      data.annotations[KubeVirtPreAllocatedDataVolumeAnnotation.OSType] = null;
    }

    return data;
  }
}
