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

import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {filter, take, takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {NotificationService, UserService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {Subject} from 'rxjs';
import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';
import {Admin, Member} from '../../../shared/entity/member';
import * as _ from 'lodash';

@Component({
  selector: 'km-admins',
  templateUrl: './admins.component.html',
})
export class AdminsComponent implements OnInit, OnChanges {
  user: Member;
  admins: Admin[] = [];
  dataSource = new MatTableDataSource<Admin>();
  displayedColumns: string[] = ['name', 'email', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.admins;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._settingsService.admins.pipe(takeUntil(this._unsubscribe)).subscribe(admins => {
      this.admins = admins;
      this.dataSource.data = this.admins;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));
  }

  ngOnChanges(): void {
    this.dataSource.data = this.admins;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isDeleteEnabled(admin: Admin): boolean {
    return !!this.user && admin.email !== this.user.email;
  }

  delete(admin: Admin): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Admin',
        message: `Are you sure you want to take admin rights from ${admin.name}?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(take(1))
      .subscribe(_ => {
        admin.isAdmin = false;
        this._updateAdmin(admin);
      });
  }

  private _updateAdmin(admin: Admin): void {
    this._settingsService
      .setAdmin(admin)
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`The <strong>${admin.name}</strong> user was deleted from admin group`);
        this._settingsService.refreshAdmins();
      });
  }

  add(): void {
    this._matDialog
      .open(AddAdminDialogComponent)
      .afterClosed()
      .pipe(take(1))
      .subscribe(admin => {
        if (admin) {
          this._settingsService.refreshAdmins();
        }
      });
  }

  isPaginatorVisible(): boolean {
    return this.admins && this.admins.length > 0 && this.paginator && this.admins.length > this.paginator.pageSize;
  }
}
