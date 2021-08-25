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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges, AfterViewChecked} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {getEditionDirName} from '@app/dynamic/common';
import {OPAService} from '@core/services/opa';
import {UserService} from '@core/services/user';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Constraint, ConstraintSelector, ConstraintTemplate, Kind} from '@shared/entity/opa';
import {UserSettings} from '@shared/entity/settings';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {Mode, DefaultConstraintDialog} from './default-constraint-dialog/component';

@Component({
  selector: 'km-default-constraint-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DefaultConstraintComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  displayedColumns: string[] = this.getColumns();
  settings: UserSettings;
  defaultConstraints: Constraint[] = [];
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<Constraint>();
  constraintTemplateFilter: string;
  isToggled = [];
  appliesToColumnWidth = 0;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _opaService: OPAService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.defaultConstraints;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._opaService.defaultConstraints.pipe(takeUntil(this._unsubscribe)).subscribe(defaultConstraints => {
      this.defaultConstraints = defaultConstraints;
      this.dataSource.data = this.defaultConstraints;
    });

    this._opaService.constraintTemplates
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        constraintTemplates => (this.constraintTemplates = _.sortBy(constraintTemplates, ct => ct.name.toLowerCase()))
      );

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngAfterViewChecked(): void {
    const box = document.querySelector('.applies-to-column') as HTMLElement;
    if (box) {
      this.appliesToColumnWidth = box.offsetWidth;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.defaultConstraints) {
      this.dataSource.data = this.defaultConstraints;
    }
    this.filter();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getColumns(): string[] {
    switch (getEditionDirName()) {
      case 'enterprise':
        return ['name', 'constraintTemplate', 'match', 'appliesTo', 'status', 'actions'];
      default:
        return ['name', 'constraintTemplate', 'match', 'actions'];
    }
  }

  isPaginatorVisible(): boolean {
    return (
      this.defaultConstraints &&
      this.defaultConstraints.length > 0 &&
      this.paginator &&
      this.defaultConstraints.length > this.paginator.pageSize
    );
  }

  hasNoData(): boolean {
    return _.isEmpty(this.defaultConstraints);
  }

  hasNoMatches(selector: ConstraintSelector): boolean {
    return _.isEmpty(selector.providers) && _.isEmpty(selector.labelSelector.matchLabels);
  }

  toggleColumn(name: string): void {
    this.isToggled[name] = !this.isToggled[name];
  }

  filter(): void {
    this.dataSource.data = this.defaultConstraints.filter(constraint =>
      this.constraintTemplateFilter ? constraint.spec.constraintType === this.constraintTemplateFilter : true
    );
  }

  displayKindNames(element: Kind[]): string {
    return element ? element.map(x => x.kinds).join(', ') : '';
  }

  updateStatus(constraint: Constraint): void {
    const patch = constraint;
    patch.spec.disabled = !constraint.spec.disabled;
    this._opaService
      .patchDefaultConstraint(constraint.name, patch)
      .pipe(take(1))
      .subscribe(result => {
        this._notificationService.success(`The default constraint ${result.name} was updated`);
        this._opaService.refreshConstraint();
      });
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Default Constraint',
        mode: Mode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(DefaultConstraintDialog, dialogConfig);
  }

  edit(defaultConstraint: Constraint): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Default Constraint',
        defaultConstraint: defaultConstraint,
        mode: Mode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(DefaultConstraintDialog, dialogConfig);
  }

  delete(defaultConstraint: Constraint): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Default Constraint',
        message: `Are you sure you want to delete the default constraint ${defaultConstraint.name}?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._opaService.deleteDefaultConstraint(defaultConstraint.name)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`The default constraint ${defaultConstraint.name} was deleted`);
        this._opaService.refreshDefaultConstraints();
      });
  }
}
