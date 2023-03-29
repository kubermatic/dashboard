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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {Observable, Subject, of} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Cluster} from '@shared/entity/cluster';
import {ControlsOf} from '@shared/model/shared';
import {ClusterServiceAccount} from '@shared/entity/rbac';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import {ErrorType} from '@app/shared/types/error-type';

interface AddServiceAccountControls {
  name: string;
  namespace: string;
}

export enum Controls {
  Name = 'name',
  Namespace = 'namespace',
}

@Component({
  selector: 'km-add-binding-dialog',
  templateUrl: './template.html',
})
export class AddServiceAccountDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  readonly ErrorType = ErrorType;

  namespaces: string[] = [];
  form: FormGroup<ControlsOf<AddServiceAccountControls>>;

  @Input() cluster: Cluster;
  @Input() projectID: string;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _rbacService: RBACService,
    private readonly _matDialogRef: MatDialogRef<AddServiceAccountDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _clusterServiceAccountService: ClusterServiceAccountService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._getClusterNamespaces();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<ClusterServiceAccount> {
    if (this.form.invalid) {
      return of(null);
    }

    return this._clusterServiceAccountService
      .post(this.projectID, this.cluster.id, this.form.value as ClusterServiceAccount)
      .pipe(takeUntil(this._unsubscribe));
  }

  onNext(serviceAccount: ClusterServiceAccount): void {
    this._matDialogRef.close(serviceAccount);
    this._notificationService.success(`Added the ${serviceAccount.name} service account`);
  }

  private _initForm(): void {
    this.form = this._builder.nonNullable.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Namespace]: this._builder.control('', [Validators.required]),
    });
  }

  private _getClusterNamespaces(): void {
    this._rbacService
      .getClusterNamespaces(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(namespaces => {
        this.namespaces = namespaces;
      });
  }
}
