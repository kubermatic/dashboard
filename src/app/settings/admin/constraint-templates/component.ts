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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {OPAService} from '@core/services/opa/service';
import {UserService} from '@core/services/user/service';
import {ConstraintTemplate} from '@shared/entity/opa';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {Mode, ConstraintTemplateDialog} from './constraint-template-dialog/component';
import {DeleteConstraintTemplateDialog} from './delete-constraint-template-dialog/component';

@Component({
  selector: 'km-constraint-templates-list',
  templateUrl: './template.html',
})
export class ConstraintTemplatesComponent implements OnInit, OnChanges, OnDestroy {
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<ConstraintTemplate>();
  displayedColumns: string[] = ['templateName', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _opaService: OPAService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.constraintTemplates;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'templateName';
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

  ngOnChanges(): void {
    this.dataSource.data = this.constraintTemplates;
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

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Constraint Template',
        mode: Mode.Add,
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
        mode: Mode.Edit,
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
        constraintTemplate: constraintTemplate,
      },
    };

    this._matDialog
      .open(DeleteConstraintTemplateDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }
}
