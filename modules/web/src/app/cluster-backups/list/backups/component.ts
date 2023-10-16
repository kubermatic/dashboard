// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {AddClustersBackupsDialogComponent} from './add-dialog/component';
import {UserService} from '@app/core/services/user';
import {Subject, switchMap, take, takeUntil} from 'rxjs';
import {MemberUtils, Permission} from '@app/shared/utils/member';
import {Member} from '@app/shared/entity/member';
import {GroupConfig} from '@shared/model/Config';
import {ProjectService} from '@core/services/project';
import {Project} from '@shared/entity/project';
import {CookieService} from 'ngx-cookie-service';
import {MatTableDataSource} from '@angular/material/table';
import {ClusterBackups} from '@app/shared/entity/backup';
import {DeleteBackupDialogComponent} from './delete-dialog/component';
import {AddRestoreDialogComponent} from '../restore/add-dialog/component';

@Component({
  selector: 'km-cluster-backups-list',
  templateUrl: './template.html',
})
export class ClustersBackupsListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  selectedProject: Project;
  isAdmin = false;
  dataSource = new MatTableDataSource<ClusterBackups>();

  get columns(): string[] {
    return ['name', 'labels', 'cluster', 'destination', 'schedule', 'namespaces', 'created', 'actions'];
  }

  get canAdd(): boolean {
    const can = MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'clusterbackups', Permission.Create);

    return can;
  }

  get data(): any {
    return JSON.parse(this._cookieService.get('backup') || '[]');
  }
  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _projectService: ProjectService,
    private readonly _cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.data;

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this.selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  add(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this.selectedProject.id,
      },
    };
    this._matDialog
      .open(AddClustersBackupsDialogComponent, config)
      .afterClosed()
      .subscribe(() => {
        this.dataSource.data = JSON.parse(this._cookieService.get('backup') || '[]');
      });
  }

  restoreBackup(backup: any): void {
    const config: MatDialogConfig = {
      data: {
        backup,
        projectID: this.selectedProject.id,
      },
    };
    this._matDialog.open(AddRestoreDialogComponent, config);
  }

  deleteBackup(backupName: string): void {
    const config: MatDialogConfig = {
      data: {
        backupName,
      },
    };
    this._matDialog
      .open(DeleteBackupDialogComponent, config)
      .afterClosed()
      .subscribe(res => {
        if (res) {
          const backups = JSON.parse(this._cookieService.get('backup') || '[]');
          const filteredBackups = backups.filter(backup => backup.name !== backupName);
          this._cookieService.set('backup', JSON.stringify(filteredBackups));
        }
        this.dataSource.data = JSON.parse(this._cookieService.get('backup') || '[]');
      });
  }
}
