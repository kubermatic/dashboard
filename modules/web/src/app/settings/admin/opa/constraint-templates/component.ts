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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges} from '@angular/core';
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {MatLegacyPaginator as MatPaginator} from '@angular/material/legacy-paginator';
import {MatSort} from '@angular/material/sort';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {OPAService} from '@core/services/opa';
import {UserService} from '@core/services/user';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {ConstraintTemplate} from '@shared/entity/opa';
import {DialogActionMode} from '@shared/types/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {ConstraintTemplateDialog} from './constraint-template-dialog/component';

@Component({
  selector: 'km-constraint-templates-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ConstraintTemplatesComponent implements OnInit, OnChanges, OnDestroy {
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<ConstraintTemplate>();
  displayedColumns: string[] = ['name', 'actions'];
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
    this.dataSource.data = this.constraintTemplates;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._opaService.constraintTemplates.pipe(takeUntil(this._unsubscribe)).subscribe(constraintTemplates => {
      this.constraintTemplates = constraintTemplates;
      this.dataSource.data = this.constraintTemplates;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.constraintTemplates) {
      this.dataSource.data = this.constraintTemplates;
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.constraintTemplates &&
      this.constraintTemplates.length > 0 &&
      this.paginator &&
      this.constraintTemplates.length > this.paginator.pageSize
    );
  }

  hasNoData(): boolean {
    return _.isEmpty(this.constraintTemplates);
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Constraint Template',
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog
      .open(ConstraintTemplateDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  edit(constraintTemplate: ConstraintTemplate): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Constraint Template',
        constraintTemplate: constraintTemplate,
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog
      .open(ConstraintTemplateDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  delete(constraintTemplate: ConstraintTemplate): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Constraint Template',
        message: `Delete <b>${constraintTemplate.name}</b> constraint template permanently?`,
        confirmLabel: 'Delete',
        warning: 'Deleting this constraint template will cause all constraints related to it to be deleted as well.',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._opaService.deleteConstraintTemplate(constraintTemplate.name)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${constraintTemplate.name} constraint template`);
        this._opaService.refreshConstraintTemplates();
      });
  }
}
