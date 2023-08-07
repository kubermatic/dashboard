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

import {Component, OnDestroy, OnInit, TrackByFunction, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {BackupService} from '@core/services/backup';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent, ConfirmationDialogConfig} from '@shared/components/confirmation-dialog/component';
import {EtcdRestore} from '@shared/entity/backup';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';

@Component({
  selector: 'km-restore-list',
  templateUrl: './template.html',
})
export class RestoreListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, {static: true}) private readonly _paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();
  private readonly _onChange = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _selectedProject = {} as Project;
  private _restores = [];
  dataSource = new MatTableDataSource<EtcdRestore>();
  isInitialized = true;

  get trackByID(): TrackByFunction<EtcdRestore> {
    return (_: number, restore: EtcdRestore): string => restore.name;
  }

  get columns(): string[] {
    return ['name', 'phase', 'clusterID', 'backupName', 'destination', 'actions'];
  }

  get isEmpty(): boolean {
    return this._restores.length === 0;
  }

  get hasPaginator(): boolean {
    return !this.isEmpty && this._paginator && this._restores.length > this._paginator.pageSize;
  }

  get canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Delete);
  }

  constructor(
    private readonly _backupService: BackupService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.paginator = this._paginator;

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this._paginator;
    });

    this._projectService.selectedProject
      .pipe(tap(project => (this._selectedProject = project)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._onChange.next());

    this._onChange
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._selectedProject.id).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._onChange
      .pipe(switchMap(_ => this._backupService.restoreList(this._selectedProject.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(restores => {
        this._restores = restores;
        this.dataSource.data = this._restores;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  delete(restore: EtcdRestore): void {
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Restore Object',
        message: `Delete <b>${restore.name}</b> restore object permanently?`,
        confirmLabel: 'Delete',
      } as ConfirmationDialogConfig,
    };

    this._matDialog
      .open(ConfirmationDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(
        switchMap(_ =>
          this._backupService.restoreDelete(this._selectedProject.id, restore.spec.clusterId, restore.name)
        )
      )
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${restore.name} restore object`);
        this._onChange.next();
      });
  }
}
