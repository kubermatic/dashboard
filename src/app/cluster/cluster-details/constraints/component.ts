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

import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {OPAService} from '@core/services/opa/service';
import {UserService} from '@core/services/user/service';
import {NotificationService} from '@core/services/notification/service';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '@shared/entity/cluster';
import {Constraint, Kind, Violation} from '@shared/entity/opa';
import {UserSettings} from '@shared/entity/settings';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil, filter, switchMap} from 'rxjs/operators';
import {Mode, ConstraintDialog} from './constraint-dialog/component';

@Component({
  selector: 'km-constraints-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ConstraintsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  constraints: Constraint[] = [];
  settings: UserSettings;
  dataSource = new MatTableDataSource<Constraint>();
  displayedColumns: string[] = ['constraintName', 'constraintTemplate', 'match', 'violations', 'actions'];
  toggledColumns: string[] = ['violationDetails'];
  isShowDetails = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  paginator: MatPaginator;
  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    if (this.paginator && this.settings) {
      this.paginator.pageSize = this.settings.itemsPerPage;
    }
    this.dataSource.paginator = this.paginator;
    this._cdr.detectChanges();
  }

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _opaService: OPAService,
    private readonly _userService: UserService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.constraints;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'constraintName';
    this.sort.direction = 'asc';

    this._opaService
      .constraints(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(constraints => {
        this.constraints = constraints;
        this.dataSource.data = this.constraints;
      });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.constraints &&
      this.constraints.length > 0 &&
      this.paginator &&
      this.constraints.length > this.paginator.pageSize
    );
  }

  isLoadingData(data: Constraint[]): boolean {
    return _.isEmpty(data) && !this.isClusterRunning;
  }

  hasNoData(data: Constraint[]): boolean {
    return _.isEmpty(data) && this.isClusterRunning;
  }

  toggleDetails(element: Constraint): void {
    this.isShowDetails[element.name] = !this.isShowDetails[element.name];
  }

  listMatch(element: Kind[]): string {
    const matches = [];
    element.forEach(x => matches.push(x.kinds));
    return matches.join(', ');
  }

  getViolationCount(violations: Violation[]): number {
    return violations ? violations.length : 0;
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Constraint',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        mode: Mode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog
      .open(ConstraintDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  edit(constraint: Constraint, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Constraint',
        projectId: this.projectID,
        clusterId: this.cluster.id,
        constraint: constraint,
        mode: Mode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog
      .open(ConstraintDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  delete(constraint: Constraint, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Constraint',
        message: `Are you sure you want to delete the constraint ${constraint.name}?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._opaService.deleteConstraint(this.projectID, this.cluster.id, constraint.name)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`The constraint template ${constraint.name} was deleted`);
        this._opaService.refreshConstraintTemplates();
      });
  }
}
