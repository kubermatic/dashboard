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

import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ActivatedRoute} from '@angular/router';
import {ClusterService} from '@app/core/services/cluster';
import {NotificationService} from '@app/core/services/notification';
import {PathParam} from '@app/core/services/params';
import {Cluster} from '@app/shared/entity/cluster';
import {ExternalClusterModel} from '@shared/entity/external-cluster';
import {Observable} from 'rxjs';

export enum Controls {
  Name = 'name',
}

@Component({
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EditClusterConnectionDialogComponent implements OnInit {
  @Input() name = '';
  @Input() projectId: string;
  controls = Controls;
  form: FormGroup;
  kubeconfig = '';
  clusterID: string;

  constructor(
    private readonly _matDialogRef: MatDialogRef<EditClusterConnectionDialogComponent>,
    private readonly _clusterService: ClusterService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({name: new FormControl(this.name, [Validators.required])});
    this.clusterID = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);
  }

  getObservable(): Observable<Cluster> {
    const model: ExternalClusterModel = {
      name: this.form.get(Controls.Name).value,
      kubeconfig: btoa(this.kubeconfig),
    };

    this._matDialogRef.close(model);
    return this._clusterService.updateExternalCluster(this.projectId, this.clusterID, model);
  }

  onNext(): void {
    this._clusterService.onClusterUpdate.next();
    this._notificationService.success(`Updated the ${this.name} cluster`);
  }
}
