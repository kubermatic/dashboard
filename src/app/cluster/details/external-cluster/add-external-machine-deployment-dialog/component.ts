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

import {Component, forwardRef, Inject, OnInit} from '@angular/core';
import {BaseFormValidator} from '@app/shared/validators/base-form.validator';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {DialogDataOutput} from '@app/node-data/dialog/component';
import {ExternalMachineDeployment} from '@app/shared/entity/external-machine-deployment';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {ExternalCluster} from '@app/shared/entity/external-cluster';

enum Controls {
  MachineDeploymentData = 'machineDeploymentData',
}

interface AddExternalMachineDeploymentDialogConfig {
  projectId: string;
  clusterData: ExternalCluster;
}

@Component({
  selector: 'km-add-external-machine-deployment-dialog',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddExternalMachineDeploymentDialogComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AddExternalMachineDeploymentDialogComponent),
      multi: true,
    },
  ],
})
export class AddExternalMachineDeploymentDialogComponent extends BaseFormValidator implements OnInit {
  projectID = this._data.projectId;
  cluster = this._data.clusterData;
  readonly Controls = Controls;
  private _output: DialogDataOutput = {
    externalMachineDeploymentData: ExternalMachineDeployment.NewEmptyMachineDeployment(),
  } as DialogDataOutput;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: AddExternalMachineDeploymentDialogConfig,
    private readonly _builder: FormBuilder,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private _dialogRef: MatDialogRef<AddExternalMachineDeploymentDialogComponent>
  ) {
    super();
  }

  get formDialogValid(): boolean {
    return this._externalMachineDeploymentService.isAddMachineDeploymentFormValid;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.MachineDeploymentData]: this._builder.control(''),
    });
    console.log(this.cluster);
    
  }

  onConfirm(): void {
    this._output = {externalMachineDeploymentData: this._externalMachineDeploymentService.externalMachineDeployment};
    this._dialogRef.close(this._output);
  }
}
