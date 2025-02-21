// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, forwardRef, Inject} from '@angular/core';
import {BaseFormValidator} from '@app/shared/validators/base-form.validator';
import {NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {ExternalCluster} from '@app/shared/entity/external-cluster';

interface ExternalAddMachineDeploymentDialogConfig {
  projectId: string;
  clusterData: ExternalCluster;
}

@Component({
  selector: 'km-external-add-machine-deployment-dialog',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExternalAddMachineDeploymentDialogComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ExternalAddMachineDeploymentDialogComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class ExternalAddMachineDeploymentDialogComponent extends BaseFormValidator {
  projectID = this._data.projectId;
  cluster = this._data.clusterData;

  constructor(
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _dialogRef: MatDialogRef<ExternalAddMachineDeploymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: ExternalAddMachineDeploymentDialogConfig
  ) {
    super();
  }

  get isFormValid(): boolean {
    return this._externalMachineDeploymentService.isAddMachineDeploymentFormValid;
  }

  onConfirm(): void {
    this._dialogRef.close(this._externalMachineDeploymentService.externalMachineDeployment);
  }
}
