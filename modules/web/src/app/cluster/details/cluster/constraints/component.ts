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

import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {Constraint, ConstraintTemplate, Kind, Violation} from '@shared/entity/opa';
import {UserSettings} from '@shared/entity/settings';
import {DialogActionMode} from '@shared/types/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {ConstraintDialog} from './constraint-dialog/component';

@Component({
  selector: 'km-constraint-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ConstraintsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() constraints: Constraint[] = [];
  settings: UserSettings;
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<Constraint>();
  displayedColumns: string[] = ['stateArrow', 'name', 'constraintTemplate', 'match', 'violations', 'actions'];
  toggledColumns: string[] = ['violationDetails'];
  isShowDetails = [];
  constraintTemplateFilter: string;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _opaService: OPAService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.constraints;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._opaService.constraintTemplates
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        constraintTemplates => (this.constraintTemplates = _.sortBy(constraintTemplates, ct => ct.name.toLowerCase()))
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.constraints) {
      this.dataSource.data = this.constraints;
    }
    this.filter();
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

  isDefaultConstraint(element: Constraint): boolean {
    return !!element.labels && !!Object.keys(element.labels).find(key => key === 'default');
  }

  toggleDetails(element: Constraint): void {
    if (element.spec.disabled) {
      return;
    }
    this.isShowDetails[element.name] = !this.isShowDetails[element.name];
  }

  getRowTooltip(constraint: Constraint): string {
    return constraint.spec.disabled ? 'Constraint is disabled by your admin' : '';
  }

  displayKindNames(element: Kind[]): string {
    return element ? element.map(x => x.kinds).join(', ') : '';
  }

  getViolationCount(violations: Violation[]): number {
    return violations ? violations.length : 0;
  }

  filter(): void {
    this.dataSource.data = this.constraints.filter(constraint =>
      this.constraintTemplateFilter ? constraint.spec.constraintType === this.constraintTemplateFilter : true
    );
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Constraint',
        projectId: this.projectID,
        cluster: this.cluster,
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(ConstraintDialog, dialogConfig);
  }

  edit(constraint: Constraint, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Constraint',
        projectId: this.projectID,
        cluster: this.cluster,
        constraint: constraint,
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(ConstraintDialog, dialogConfig);
  }

  delete(constraint: Constraint, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Constraint',
        message: `Delete <b>${constraint.name}</b> OPA constraint of <b>${this.cluster.name}</b> cluster permanently?`,
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
        this._opaService.refreshConstraint();
        this._notificationService.success(`Deleting the ${constraint.name} constraint`);
      });
  }
}
