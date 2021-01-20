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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {UserService} from '@core/services/user/service';
import {ConstraintTemplate} from '@shared/entity/opa';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil, filter, take} from 'rxjs/operators';
import {OPADataDialogComponent} from './opa-data-dialog/component';

@Component({
  selector: 'km-opa-admin',
  templateUrl: './template.html',
})
export class OPAAdminComponent implements OnInit, OnDestroy {
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<ConstraintTemplate>();
  displayedColumns: string[] = ['templateName', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _apiService: ApiService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.constraintTemplates;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'templateName';
    this.sort.direction = 'asc';

    this._apiService
      .getConstraintTemplates()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(constraintTemplates => {
        this.constraintTemplates = constraintTemplates;
        this.dataSource.data = this.constraintTemplates;
      });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
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
        isEditing: false,
        confirmLabel: 'Add',
      },
    };

    this._matDialog
      .open(OPADataDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(constraintTemplate => !!constraintTemplate))
      .pipe(take(1))
      .subscribe((result: ConstraintTemplate) => this._add(result));
  }

  private _add(constraintTemplate: ConstraintTemplate): void {
    this._apiService
      .createConstraintTemplate(constraintTemplate)
      .pipe(take(1))
      .subscribe(constraintTemplate => {
        this._notificationService.success(`The constraint template ${constraintTemplate.name} was created`);
      });
  }
}
