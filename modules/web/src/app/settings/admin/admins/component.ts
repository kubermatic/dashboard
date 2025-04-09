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

import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Admin, Member} from '@shared/entity/member';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {AddAdminDialogComponent} from './add-admin-dialog/component';

@Component({
  selector: 'km-admins',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  standalone: false,
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
      data: {
        title: 'Remove Administrator',
        message: `Remove <b>${_.escape(admin.name)}</b> from administrators?`,
        confirmLabel: 'Remove',
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
        this._notificationService.success(`Removed the ${admin.name} user from the admin group`);
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

  getDeleteId(admin: Admin): string {
    return `km-admin-delete-${btoa(admin.email)}`;
  }

  isPaginatorVisible(): boolean {
    return this.admins && this.admins.length > 0 && this.paginator && this.admins.length > this.paginator.pageSize;
  }
}
