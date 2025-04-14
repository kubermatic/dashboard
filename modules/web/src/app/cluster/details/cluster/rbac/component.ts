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

import {Component, Input, OnDestroy} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {ClusterBinding, ClusterServiceAccount, Kind, SimpleClusterBinding} from '@shared/entity/rbac';
import {iif, Subject} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {AddBindingDialogComponent} from './add-binding-dialog/component';
import {AddServiceAccountBindingDialogComponent} from './add-service-account-binding-dialog/component';
import {AddServiceAccountDialogComponent} from './add-service-account-dialog/component';
import _ from 'lodash';

@Component({
  selector: 'km-rbac',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class RBACComponent implements OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;

  readonly RBACKind = Kind;
  modes: Kind[] = [Kind.ServiceAccount, Kind.User, Kind.Group];
  modeControl = new FormControl<Kind>(Kind.ServiceAccount);

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _rbacService: RBACService,
    private readonly _clusterServiceAccountService: ClusterServiceAccountService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addBinding(event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(AddBindingDialogComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal.componentInstance.subjectType = this.modeControl.value;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => this._refreshBindings());
  }

  addServiceAccount($event: Event): void {
    $event.stopPropagation();
    const dialogRef = this._matDialog.open(AddServiceAccountDialogComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.projectID = this.projectID;

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._refreshBindings();
      });
  }

  addServiceAccountBinding(clusterServiceAccount?: ClusterServiceAccount): void {
    const dialogRef = this._matDialog.open<AddServiceAccountBindingDialogComponent, unknown, ClusterBinding>(
      AddServiceAccountBindingDialogComponent
    );
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.projectID = this.projectID;
    dialogRef.componentInstance.clusterServiceAccount = clusterServiceAccount;

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._refreshBindings();
      });
  }

  deleteServiceAccount(element: ClusterServiceAccount): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Service Account',
        message: `Delete service account <b>${_.escape(element.name)}</b> of <b>${_.escape(this.cluster.name)}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(
        filter(isConfirmed => isConfirmed),
        switchMap(_ =>
          this._clusterServiceAccountService.delete(this.projectID, this.cluster.id, element.namespace, element.name)
        ),
        take(1)
      )
      .subscribe(() => {
        this._refreshBindings();
        this._notificationService.success(`Removed service account ${element.name} from ${this.cluster.name}`);
      });
  }

  deleteBinding(element: SimpleClusterBinding): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Binding',
        message: `Delete binding for ${element.kind.toLowerCase()} <b>${_.escape(element.name)}</b> of <b>${_.escape(this.cluster.name)}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(
        filter(isConfirmed => isConfirmed),
        switchMap(_ =>
          iif(
            () => !!element.namespace,
            this._rbacService.deleteNamespaceBinding(
              this.cluster.id,
              this.projectID,
              element.clusterRole,
              element.namespace,
              element.kind,
              element.name,
              element.subjectNamespace
            ),
            this._rbacService.deleteClusterBinding(
              this.cluster.id,
              this.projectID,
              element.clusterRole,
              element.kind,
              element.name,
              element.subjectNamespace
            )
          )
        ),
        take(1)
      )
      .subscribe(() => {
        this._refreshBindings();
        this._notificationService.success(`Removed ${element.name} ${element.kind} from the binding`);
      });
  }

  private _refreshBindings(): void {
    this._rbacService.refreshClusterBindings();
    this._rbacService.refreshNamespaceBindings();
    this._clusterServiceAccountService.refreshServiceAccounts();
  }
}
