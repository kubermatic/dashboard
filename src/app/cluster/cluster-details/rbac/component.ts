// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {NotificationService} from '@core/services/notification/service';
import {RBACService} from '@core/services/rbac/service';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '@shared/entity/cluster';
import {SimpleBinding, SimpleClusterBinding} from '@shared/entity/rbac';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, first, switchMap} from 'rxjs/operators';
import {AddBindingComponent} from './add-binding/component';

@Component({
  selector: 'km-rbac',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class RBACComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() seed: string;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() clusterBindings: SimpleClusterBinding[] = [];
  @Input() bindings: SimpleBinding[] = [];

  isShowRBAC = false;
  dataSourceCluster = new MatTableDataSource<SimpleClusterBinding>();
  displayedColumnsCluster: string[] = ['kind', 'name', 'clusterRole', 'actions'];
  dataSourceNamespace = new MatTableDataSource<SimpleBinding>();
  displayedColumnsNamespace: string[] = ['kind', 'name', 'clusterRole', 'namespace', 'actions'];
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _rbacService: RBACService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSourceCluster.data = this.clusterBindings;
    this.dataSourceNamespace.data = this.bindings;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addBinding(event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(AddBindingComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
    modal.componentInstance.projectID = this.projectID;
  }

  getDataSourceCluster(): MatTableDataSource<SimpleClusterBinding> {
    this.dataSourceCluster.data = this.clusterBindings;
    return this.dataSourceCluster;
  }

  getDataSourceNamespace(): MatTableDataSource<SimpleBinding> {
    this.dataSourceNamespace.data = this.bindings;
    return this.dataSourceNamespace;
  }

  toggleRBAC(): void {
    this.isShowRBAC = !this.isShowRBAC;
  }

  isLoadingData(data: SimpleBinding[] | SimpleClusterBinding[]): boolean {
    return _.isEmpty(data) && !this.isClusterRunning;
  }

  hasNoData(data: SimpleBinding[] | SimpleClusterBinding[]): boolean {
    return _.isEmpty(data) && this.isClusterRunning;
  }

  deleteClusterBinding(element: SimpleClusterBinding, event: Event): void {
    event.stopPropagation();

    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Binding',
        message: `Are you sure you want to permanently delete the ${element.kind.toLowerCase()} "<strong>${
          element.name
        }</strong>" from binding?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ =>
          this._rbacService.deleteClusterBinding(
            this.cluster.id,
            this.seed,
            this.projectID,
            element.role,
            element.kind,
            element.name
          )
        )
      )
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `The <strong>${element.name}</strong> ${element.kind} was removed from the binding`
        );
      });
  }

  deleteBinding(element: SimpleBinding, event: Event): void {
    event.stopPropagation();

    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Binding',
        message: `Are you sure you want to permanently delete the ${element.kind.toLowerCase()} "<strong>${
          element.name
        }</strong>" from binding?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ =>
          this._rbacService.deleteBinding(
            this.cluster.id,
            this.seed,
            this.projectID,
            element.role,
            element.namespace,
            element.kind,
            element.name
          )
        )
      )
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `The <strong>${element.name}</strong> ${element.kind} was removed from the binding`
        );
      });
  }
}
