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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {
  DeleteSnapshotDialogComponent,
  DeleteSnapshotDialogConfig,
} from '@app/backup/list/snapshot/delete-dialog/component';
import {BackupService} from '@core/services/backup';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {
  ConditionStatus,
  EtcdBackupConfig,
  EtcdBackupConfigCondition,
  EtcdBackupConfigConditionType,
} from '@shared/entity/backup';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import {Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {getBackupHealthStatus, HealthStatus} from '@shared/utils/health-status';

@Component({
  selector: 'km-snapshot-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SnapshotDetailsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  selectedProject = {} as Project;
  isInitialized = false;
  backup: EtcdBackupConfig = {} as EtcdBackupConfig;

  get canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Delete);
  }

  get canEdit(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Edit);
  }

  get canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Create);
  }

  constructor(
    private readonly _backupService: BackupService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router
  ) {}

  keep(backup: EtcdBackupConfig): string | number {
    return backup.spec?.schedule ? (backup.spec?.keep ? backup.spec?.keep : 'Default') : '-';
  }

  ngOnInit(): void {
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

    this._projectService.selectedProject
      .pipe(switchMap(project => this._backupService.list(project.id, true)))
      .pipe(map(backups => backups.find(backup => backup.id === this._route.snapshot.params.backupID)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(backup => {
        this.backup = backup;
        this.isInitialized = true;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getStatus(backup: EtcdBackupConfig): HealthStatus {
    const condition =
      backup.status?.conditions?.find(
        condition => condition.type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive
      ) || ({} as EtcdBackupConfigCondition);

    return getBackupHealthStatus(backup, condition);
  }

  delete(backup: EtcdBackupConfig): void {
    const config: MatDialogConfig = {
      data: {
        snapshot: backup,
        projectID: this.selectedProject.id,
      } as DeleteSnapshotDialogConfig,
    };

    const dialog = this._matDialog.open(DeleteSnapshotDialogComponent, config);
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._router.navigate([`/projects/${this.selectedProject.id}/backups`]));
  }

  isEnabled(backup: EtcdBackupConfig): boolean {
    const condition =
      backup.status?.conditions?.find(
        condition => condition.type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive
      ) || ({} as EtcdBackupConfigCondition);

    return (
      condition.type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive &&
      condition.status === ConditionStatus.ConditionTrue
    );
  }
}
