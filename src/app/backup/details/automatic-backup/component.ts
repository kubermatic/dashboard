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

import {Component, OnDestroy, OnInit, TrackByFunction, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute} from '@angular/router';
import {BackupService} from '@core/services/backup';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent, ConfirmationDialogConfig} from '@shared/components/confirmation-dialog/component';
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
import {BackupHealthStatus} from '@shared/utils/health-status/backup-health-status';
import {HealthStatus} from '@shared/utils/health-status/health-status';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import {Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-automatic-backup-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AutomaticBackupDetailsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, {static: true}) private readonly _paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _selectedProject = {} as Project;
  private _backups = [];
  dataSource = new MatTableDataSource<EtcdBackupConfig>();
  isInitialized = true;
  backup: EtcdBackupConfig = {} as EtcdBackupConfig;

  get trackByID(): TrackByFunction<EtcdBackupConfig> {
    return (_: number, backup: EtcdBackupConfig): string => backup.name;
  }

  get columns(): string[] {
    return ['status', 'name', 'created', 'actions'];
  }

  get isEmpty(): boolean {
    return this._backups.length === 0;
  }

  get hasPaginator(): boolean {
    return !this.isEmpty && this._paginator && this._backups.length > this._paginator.pageSize;
  }

  get canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Delete);
  }

  get canEdit(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Edit);
  }

  get canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Create);
  }

  keep(backup: EtcdBackupConfig): string | number {
    return backup.spec?.schedule ? (backup.spec?.keep ? backup.spec?.keep : 'Default') : '-';
  }

  constructor(
    private readonly _backupService: BackupService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.dataSource.paginator = this._paginator;

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this._paginator;
    });

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._projectService.selectedProject
      .pipe(switchMap(project => this._backupService.list(project.id)))
      .pipe(map(backups => backups.find(backup => backup.id === this._route.snapshot.params.backupID)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(backup => (this.backup = backup));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getStatus(backup: EtcdBackupConfig): HealthStatus {
    const condition =
      backup.status?.conditions?.find(
        condition => condition.Type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive
      ) || ({} as EtcdBackupConfigCondition);

    return BackupHealthStatus.getHealthStatus(backup, condition);
  }

  delete(backup: EtcdBackupConfig): void {
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Automatic Backup',
        message: `Delete "${backup.name}" automatic backup permanently?`,
        confirmLabel: 'Delete Automatic Backup',
      } as ConfirmationDialogConfig,
    };

    const dialog = this._matDialog.open(ConfirmationDialogComponent, config);
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._backupService.delete(this._selectedProject.id, backup.spec.clusterId, backup.id));
  }

  isEnabled(backup: EtcdBackupConfig): boolean {
    const condition =
      backup.status?.conditions?.find(
        condition => condition.Type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive
      ) || ({} as EtcdBackupConfigCondition);

    return (
      condition.Type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive &&
      condition.Status === ConditionStatus.ConditionTrue
    );
  }

  switchBackupStatus(backup: EtcdBackupConfig): void {
    const condition = backup.status?.conditions?.find(
      condition => condition.Type === EtcdBackupConfigConditionType.EtcdBackupConfigConditionSchedulingActive
    );

    if (!condition || condition.Status === ConditionStatus.ConditionUnknown) {
      return;
    }

    condition.Status =
      condition.Status === ConditionStatus.ConditionTrue
        ? ConditionStatus.ConditionFalse
        : ConditionStatus.ConditionTrue;

    // TODO(floreks): Patch backup
  }
}
