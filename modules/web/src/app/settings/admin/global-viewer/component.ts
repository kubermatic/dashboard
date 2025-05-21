// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SettingsService} from '@app/core/services/settings';
import {UserService} from '@app/core/services/user';
import {Admin, Member} from '@app/shared/entity/member';
import {filter, Subject, take, takeUntil} from 'rxjs';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import _ from 'lodash';
import {ConfirmationDialogComponent} from '@app/shared/components/confirmation-dialog/component';
import {NotificationService} from '@app/core/services/notification';
import {AddGlobalViewerDialogComponenet} from './add-global-viewer-dialog/component';

@Component({
  selector: 'km-global-viewer',
  templateUrl: './template.html',
  styleUrl: './style.scss',
  standalone: false,
})
export class GlobalViewerComponent implements OnInit, OnDestroy {
  globalViewers: Member[] = [];
  isLoading: boolean = false;
  dataSource = new MatTableDataSource<Member>();
  displayedColumns: string[] = ['name', 'email', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();
  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._getGlobalViewers();

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  add(): void {
    this._matDialog
      .open(AddGlobalViewerDialogComponenet)
      .afterClosed()
      .pipe(take(1))
      .subscribe(gv => {
        if (gv) {
          this._getGlobalViewers();
        }
      });
  }

  delete(user: Member): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Remove Global Viewer',
        message: `Remove <b>${_.escape(user.name)}</b> from Global Viewers Group?`,
        confirmLabel: 'Remove',
      },
    };
    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(take(1))
      .subscribe(_ => {
        this._removeGlobalViewer(user);
      });
  }

  isPaginatorVisible(): boolean {
    return this.globalViewers && !!this.globalViewers.length;
  }

  private _getGlobalViewers(): void {
    this.isLoading = true;
    this._settingsService.users.pipe(takeUntil(this._unsubscribe)).subscribe(users => {
      this.globalViewers = users.filter(user => user.email && user.name && user.isGlobalViewer);
      this.isLoading = false;
      this.dataSource.data = this.globalViewers;
    });
  }

  private _removeGlobalViewer(user: Member): void {
    const adminViewer: Admin = {
      email: user.email,
      isGlobalViewer: false,
    };
    this._settingsService
      .setAdmin(adminViewer)
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`Removed the ${adminViewer.name} user from the global viewer group`);
        this._getGlobalViewers();
      });
  }
}
