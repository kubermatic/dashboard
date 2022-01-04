// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {FormControl, FormGroup} from '@angular/forms';

class ReplicasDialogData {
  projectID: string;
  clusterID: string;
  machineDeployment: ExternalMachineDeployment;
}

enum Control {
  Replicas = 'replicas',
}

@Component({
  selector: 'km-replicas-dialog',
  templateUrl: './template.html',
})
export class ReplicasDialogComponent implements OnInit {
  readonly control = Control;
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReplicasDialogData,
    private readonly _dialogRef: MatDialogRef<ReplicasDialogComponent>
  ) {}

  ngOnInit() {
    this.form = new FormGroup({[Control.Replicas]: new FormControl(this.data.machineDeployment.spec.replicas)});
  }

  save(): void {
    this._dialogRef.close();
  }
}
