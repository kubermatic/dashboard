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

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ExternalMachineDeploymentService} from '@core/services/external-machine-deployment';
import {NotificationService} from '@core/services/notification';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {Observable} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

class DialogData {
  projectID: string;
  clusterID: string;
  machineDeployment: ExternalMachineDeployment;
}

enum Controls {
  Replicas = 'replicas',
  KubeletVersion = 'version',
}

@Component({
  selector: 'km-update-external-cluster-machine-deployment-cluster-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class UpdateExternalClusterMachineDeploymentDialogComponent extends BaseFormValidator implements OnInit {
  readonly Controls = Controls;
  disableReplicaControl: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly _dialogRef: MatDialogRef<UpdateExternalClusterMachineDeploymentDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _builder: FormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this._initForm();
    this._initSubscriptions();
  }

  getObservable(): Observable<any> {
    const patchModel = this._updateExternalMachineDeploymentPatchModel();
    const {projectID, clusterID, machineDeployment} = this.data;
    return this._externalMachineDeploymentService
      .patchExternalMachineDeployment(projectID, clusterID, machineDeployment.id, patchModel)
      .pipe(take(1));
  }

  onNext(md: ExternalMachineDeployment): void {
    this._notificationService.success(`Updated the ${md.name} machine deployment`);
    this._dialogRef.close();
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Replicas]: this._builder.control(1),
      [Controls.KubeletVersion]: this._builder.control(''),
    });
  }

  private _initSubscriptions() {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalMachineDeploymentPatchModel();
    });

    const initialValue = this.form.value;
    this.form
      .get(Controls.Replicas)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (initialValue[Controls.Replicas] === value) {
          this.form.get(Controls.KubeletVersion).enable({emitEvent: false});
        } else {
          this.form.get(Controls.KubeletVersion).disable({emitEvent: false});
        }
      });

    this.form
      .get(Controls.KubeletVersion)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (initialValue[Controls.KubeletVersion] === value) {
          this.disableReplicaControl = false;
        } else {
          this.disableReplicaControl = true;
        }
      });
  }

  private _updateExternalMachineDeploymentPatchModel() {
    return {
      spec: {
        replicas: this.form.get(Controls.Replicas).value,
        template: {
          versions: {
            kubelet: this.form.get(Controls.KubeletVersion).value,
          },
        },
      },
    };
  }
}
