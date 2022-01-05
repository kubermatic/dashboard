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
import {ExternalMachineDeployment, ExternalMachineDeploymentPatch} from '@shared/entity/external-machine-deployment';
import {FormControl, FormGroup} from '@angular/forms';
import {ClusterService} from '@core/services/cluster';
import {take} from 'rxjs/operators';
import {NotificationService} from '@core/services/notification';

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
    private readonly _dialogRef: MatDialogRef<ReplicasDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _clusterService: ClusterService
  ) {}

  ngOnInit() {
    this.form = new FormGroup({[Control.Replicas]: new FormControl(this.data.machineDeployment.spec.replicas)});
  }

  save(): void {
    const patch: ExternalMachineDeploymentPatch = {spec: {replicas: this.form.get(Control.Replicas).value}};
    this._clusterService
      .patchExternalMachineDeployment(this.data.projectID, this.data.clusterID, this.data.machineDeployment.id, patch)
      .pipe(take(1))
      .subscribe(md => {
        this._notificationService.success(`Number of ${md.name} machine deployment replicas was updated`);
        this._dialogRef.close();
      });
  }
}
