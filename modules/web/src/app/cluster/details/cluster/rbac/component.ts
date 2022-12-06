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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {ClusterBinding, SimpleClusterBinding, Kind} from '@shared/entity/rbac';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {AddBindingComponent} from './dialog/add-binding/component';
import {Subject, timer, iif} from 'rxjs';
import {ClusterService} from '@core/services/cluster';
import {AppConfigService} from '@app/config.service';
import {isClusterRunning} from '@shared/utils/health-status';
import {FormControl} from '@angular/forms';
import {AddServiceAccountComponent} from './dialog/add-service-account/component';
import {AddServiceAccountBindingComponent} from './dialog/add-service-account-binding/component';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {ClusterServiceAccount} from '@shared/entity/cluster-service-account';

@Component({
  selector: 'km-rbac',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class RBACComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;

  readonly RBACKind = Kind;
  modes: Kind[] = [Kind.ServiceAccount, Kind.User, Kind.Group];
  modeControl = new FormControl<Kind>(Kind.ServiceAccount);

  isClusterRunning: boolean;
  private readonly _refreshTime = 10;
  private readonly _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _rbacService: RBACService,
    private readonly _clusterServiceAccountService: ClusterServiceAccountService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService,
    private readonly _appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {
    this._refreshTimer$
      .pipe(
        switchMap(_ => this._clusterService.health(this.projectID, this.cluster.id)),
        takeUntil(this._unsubscribe)
      )
      .subscribe(health => {
        this.isClusterRunning = isClusterRunning(this.cluster, health);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addBinding(): void {
    const modal = this._matDialog.open(AddBindingComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal.componentInstance.subjectType = this.modeControl.value;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => this._updateBindings());
  }

  addServiceAccount(): void {
    const dialogRef = this._matDialog.open(AddServiceAccountComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.projectID = this.projectID;

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._updateBindings();
      });
  }

  addServiceAccountBinding(clusterServiceAccount?: ClusterServiceAccount): void {
    const dialogRef = this._matDialog.open<AddServiceAccountBindingComponent, unknown, ClusterBinding>(
      AddServiceAccountBindingComponent
    );
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.projectID = this.projectID;
    dialogRef.componentInstance.clusterServiceAccount = clusterServiceAccount;

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._updateBindings();
      });
  }

  deleteBinding(element: SimpleClusterBinding): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Binding',
        message: `Delete binding for ${element.kind.toLowerCase()} <b>${element.name}</b> of <b>${
          this.cluster.name
        }</b> cluster permanently?`,
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
            this._rbacService.deleteBinding(
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
        this._updateBindings();
        this._notificationService.success(`Removed ${element.name} ${element.kind} from the binding`);
      });
  }

  private _updateBindings(): void {
    this._clusterServiceAccountService.update();
    this._rbacService.refreshClusterBindings();
    this._rbacService.refreshNamespaceBindings();
  }
}
