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
import {AppConfigService} from '@app/config.service';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {UserService} from '@core/services/user/service';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {ConstraintTemplate} from '@shared/entity/opa';
import * as _ from 'lodash';
import {Subject, timer} from 'rxjs';
import {takeUntil, filter, take, switchMap} from 'rxjs/operators';
import {ConstraintTemplatesDataDialogComponent} from './constraint-templates-data-dialog/component';

@Component({
  selector: 'km-constraint-templates',
  templateUrl: './template.html',
})
export class ConstraintTemplatesComponent implements OnInit, OnChanges, OnDestroy {
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<ConstraintTemplate>();
  displayedColumns: string[] = ['templateName', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _refreshTime = 10; // in seconds
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _apiService: ApiService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog,
    private readonly _appConfig: AppConfigService
  ) {}

  ngOnInit() {
    this.dataSource.data = this.constraintTemplates;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'templateName';
    this.sort.direction = 'asc';

    timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.loadConstraintTemplates();
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

  loadConstraintTemplates(): void {
    this._apiService
      .getConstraintTemplates()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(constraintTemplates => {
        this.constraintTemplates = constraintTemplates;
        this.dataSource.data = this.constraintTemplates;
      });
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
      .open(ConstraintTemplatesDataDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(constraintTemplate => !!constraintTemplate))
      .pipe(take(1))
      .subscribe((result: ConstraintTemplate) => {
        this._add(result);
        this.loadConstraintTemplates();
      });
  }

  private _add(constraintTemplate: ConstraintTemplate): void {
    this._apiService
      .createConstraintTemplate(constraintTemplate)
      .pipe(take(1))
      .subscribe(constraintTemplate => {
        this._notificationService.success(`The constraint template ${constraintTemplate.name} was created`);
      });
  }

  edit(constraintTemplate: ConstraintTemplate): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Constraint Template',
        constraintTemplate: constraintTemplate,
        isEditing: true,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog
      .open(ConstraintTemplatesDataDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(constraintTemplate => !!constraintTemplate))
      .pipe(take(1))
      .subscribe((result: ConstraintTemplate) => {
        this._edit(constraintTemplate, result);
      });
  }

  private _edit(original: ConstraintTemplate, edited: ConstraintTemplate): void {
    this._apiService
      .patchConstraintTemplate(original.name, edited)
      .pipe(take(1))
      .subscribe(constraintTemplate => {
        this._notificationService.success(`The constraint template ${constraintTemplate.name} was updated`);
      });
  }

  delete(constraintTemplate: ConstraintTemplate): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Constraint Template',
        message: `Are you sure you want to delete the constraint template ${constraintTemplate.name}?
                  <p class="km-confirmation-dialog-delete-warning"> <i class="km-icon-warning"></i> Deleting this constraint template will cause all constraints related to it to be deleted as well.</p>`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._apiService.deleteConstraintTemplate(constraintTemplate.name)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`The constraint template ${constraintTemplate.name} was deleted`);
      });
  }
}
