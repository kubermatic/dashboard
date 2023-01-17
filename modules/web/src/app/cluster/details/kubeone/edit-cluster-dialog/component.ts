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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {ContainerRuntime, END_OF_DOCKER_SUPPORT_VERSION} from '@shared/entity/cluster';
import {ExternalCluster, ExternalClusterPatch, ExternalClusterSpecPatch} from '@shared/entity/external-cluster';
import {Observable, Subject} from 'rxjs';
import {startWith, take, takeUntil} from 'rxjs/operators';
import * as semver from 'semver';

enum Controls {
  ContainerRuntime = 'containerRuntime',
}

@Component({
  selector: 'km-kubeone-edit-cluster-dialog',
  templateUrl: './template.html',
})
export class KubeOneEditClusterDialogComponent implements OnInit, OnDestroy {
  readonly ContainerRuntime = ContainerRuntime;
  readonly Controls = Controls;

  @Input() cluster: ExternalCluster;
  @Input() projectID: string;

  form: FormGroup;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService,
    private readonly _matDialogRef: MatDialogRef<KubeOneEditClusterDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<ExternalCluster> {
    const patch: ExternalClusterPatch = {
      spec: {
        containerRuntime: this.form.get(Controls.ContainerRuntime).value,
      } as ExternalClusterSpecPatch,
    } as ExternalClusterPatch;

    return this._clusterService.patchExternalCluster(this.projectID, this.cluster.id, patch).pipe(take(1));
  }

  onNext(cluster: ExternalCluster): void {
    this._matDialogRef.close(cluster);
    this._clusterService.onExternalClusterUpdate.next();
    this._notificationService.success(`Updated the ${this.cluster.name} cluster`);
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.ContainerRuntime]: new FormControl(this.cluster.spec.containerRuntime || ContainerRuntime.Containerd, [
        Validators.required,
      ]),
    });
  }

  private _initSubscriptions(): void {
    this.form
      .get(Controls.ContainerRuntime)
      .valueChanges.pipe(startWith(this.form.get(Controls.ContainerRuntime).value), takeUntil(this._unsubscribe))
      .subscribe(containerRuntime => {
        if (
          semver.valid(this.cluster.spec.version) &&
          semver.gte(this.cluster.spec.version, END_OF_DOCKER_SUPPORT_VERSION) &&
          containerRuntime === ContainerRuntime.Docker
        ) {
          this.form.get(Controls.ContainerRuntime).setErrors({dockerVersionCompatibility: true});
        } else {
          this.form.get(Controls.ContainerRuntime).setErrors(null);
        }
      });
  }
}
