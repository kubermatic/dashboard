// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {
  RestoreSnapshotDialogComponent,
  RestoreSnapshotDialogConfig,
} from '@app/backup/list/snapshot/restore-dialog/component';
import {BackupService} from '@core/services/backup';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {BackupStatus, BackupStatusPhaseCompleted} from '@shared/entity/backup';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {StatusMassage} from '@app/shared/utils/health-status';

@Component({
  selector: 'km-backup-list',
  templateUrl: './template.html',
  standalone: false,
})
export class BackupListComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(MatPaginator, {static: true}) private readonly _paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  @Input('backups') private readonly _backups: BackupStatus[] = [];
  @Input('projectID') private readonly _projectID: string;
  @Input('clusterID') private readonly _clusterID: string;
  @Input('destination') private readonly _destination: string;
  @Input('backupHealth') private readonly _backupHealth: string;
  dataSource = new MatTableDataSource<BackupStatus>();

  get columns(): string[] {
    return ['name', 'phase', 'message', 'finishedAt', 'created', 'actions'];
  }

  get isEmpty(): boolean {
    return _.isEmpty(this.dataSource.data);
  }

  get hasPaginator(): boolean {
    return !this.isEmpty && this._paginator && this.dataSource.data.length > this._paginator.pageSize;
  }

  canRestore(backup: BackupStatus): boolean {
    return (
      MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Create) &&
      backup.backupPhase === BackupStatusPhaseCompleted &&
      this._backupHealth !== StatusMassage.Deleting
    );
  }

  constructor(
    private readonly _userService: UserService,
    private readonly _projectService: ProjectService,
    private readonly _backupService: BackupService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.dataSource.paginator = this._paginator;
    this.dataSource.data = this._backups;

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._projectService.selectedProject
      .pipe(switchMap(project => this._userService.getCurrentUserGroup(project.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this._paginator;
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this._backups;
  }

  restore(backup: BackupStatus): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._projectID,
        clusterID: this._clusterID,
        backupName: backup.backupName,
        destination: this._destination,
      } as RestoreSnapshotDialogConfig,
    };

    const dialog = this._matDialog.open(RestoreSnapshotDialogComponent, config);
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._backupService.refreshSnapshots());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
