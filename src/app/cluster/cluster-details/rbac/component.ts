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
import {MatTableDataSource} from '@angular/material/table';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {Binding, ClusterBinding, SimpleBinding, SimpleClusterBinding} from '@shared/entity/rbac';
import _ from 'lodash';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AddBindingComponent} from './add-binding/component';
import {combineLatest, iif, merge, of, Subject, timer} from 'rxjs';
import {ClusterService} from '@core/services/cluster';
import {ClusterHealthStatus} from '@shared/utils/health-status/cluster-health-status';
import {Health} from '@shared/entity/health';
import {AppConfigService} from '@app/config.service';

@Component({
  selector: 'km-rbac',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class RBACComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  isClusterRunning: boolean;
  clusterBindingsDataSource = new MatTableDataSource<SimpleClusterBinding>();
  clusterBindingsDisplayedColumns: string[] = ['kind', 'name', 'clusterRole', 'actions'];
  bindingsDataSource = new MatTableDataSource<SimpleBinding>();
  bindingsDisplayedColumns: string[] = ['kind', 'name', 'clusterRole', 'namespace', 'actions'];
  private readonly _refreshTime = 30; // In seconds.
  private readonly _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _refresh = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _rbacService: RBACService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService,
    private readonly _appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {
    merge(this._refreshTimer$, this._refresh)
      .pipe(
        switchMap(_ => this._clusterService.health(this.projectID, this.cluster.id)),
        tap((health: Health) => (this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health))),
        switchMap(_ =>
          combineLatest([
            iif(
              () => this.isClusterRunning,
              this._rbacService.getClusterBindings(this.cluster.id, this.projectID),
              of([])
            ),
            iif(() => this.isClusterRunning, this._rbacService.getBindings(this.cluster.id, this.projectID), of([])),
          ])
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe(([clusterBindings, bindings]) => {
        this.clusterBindingsDataSource.data = this.createSimpleClusterBinding(clusterBindings);
        this.bindingsDataSource.data = this.createSimpleBinding(bindings);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  createSimpleClusterBinding(bindings: ClusterBinding[]): SimpleClusterBinding[] {
    const clusterBindingArray = [];
    bindings.forEach(binding => {
      if (binding.subjects) {
        binding.subjects.map(subject => {
          clusterBindingArray.push({
            name: subject.name,
            role: binding.roleRefName,
            kind: subject.kind,
          });
        });
      }
    });
    return clusterBindingArray;
  }

  createSimpleBinding(bindings: Binding[]): SimpleBinding[] {
    const bindingArray = [];
    bindings.forEach(binding => {
      if (binding.subjects) {
        binding.subjects.map(subject => {
          bindingArray.push({
            name: subject.name,
            role: binding.roleRefName,
            namespace: binding.namespace,
            kind: subject.kind,
          });
        });
      }
    });
    return bindingArray;
  }

  addBinding(event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(AddBindingComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => this._refresh.next());
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
        message: `Are you sure you want to permanently delete the ${element.kind.toLowerCase()} ${
          element.name
        } from binding?`,
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
            this.projectID,
            element.role,
            element.kind,
            element.name
          )
        )
      )
      .pipe(take(1))
      .subscribe(() => {
        this._refresh.next();
        this._notificationService.success(`The ${element.name} ${element.kind} was removed from the binding`);
      });
  }

  deleteBinding(element: SimpleBinding, event: Event): void {
    event.stopPropagation();

    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Binding',
        message: `Are you sure you want to permanently delete the ${element.kind.toLowerCase()} ${
          element.name
        } from binding?`,
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
            this.projectID,
            element.role,
            element.namespace,
            element.kind,
            element.name
          )
        )
      )
      .pipe(take(1))
      .subscribe(() => {
        this._refresh.next();
        this._notificationService.success(`The ${element.name} ${element.kind} was removed from the binding`);
      });
  }
}
