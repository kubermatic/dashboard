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

import {Component, OnDestroy, OnInit, TrackByFunction, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {AddSnapshotDialogComponent, AddSnapshotDialogConfig} from '@app/backup/list/snapshot/add-dialog/component';
import {
  DeleteSnapshotDialogComponent,
  DeleteSnapshotDialogConfig,
} from '@app/backup/list/snapshot/delete-dialog/component';
import {Cluster} from '@app/shared/entity/cluster';
import {BackupService} from '@core/services/backup';
import {ClusterService} from '@core/services/cluster';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {EtcdBackupConfig, EtcdBackupConfigCondition} from '@shared/entity/backup';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {HealthStatus, getBackupHealthStatus} from '@shared/utils/health-status';
import {MemberUtils, Permission} from '@shared/utils/member';
import {forkJoin, of, Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-snapshot-list',
  templateUrl: './template.html',
  standalone: false,
})
export class SnapshotListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, {static: true}) private readonly _paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _selectedProject = {} as Project;
  private _backups = [];
  private _clusters = new Map<string, Cluster>();
  dataSource = new MatTableDataSource<EtcdBackupConfig>();
  isInitialized = true;

  get trackByID(): TrackByFunction<EtcdBackupConfig> {
    return (_: number, backup: EtcdBackupConfig): string => backup.name;
  }

  get columns(): string[] {
    return ['status', 'name', 'cluster-name', 'cluster', 'destination', 'created', 'actions'];
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

  get canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Create);
  }

  get canRestore(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Create);
  }

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _backupService: BackupService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _router: Router
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
        switchMap(project =>
          forkJoin({
            userGroup: this._userService.getCurrentUserGroup(project.id).pipe(take(1)),
            backups: this._backupService.list(project.id, true).pipe(take(1)),
            clusters: this._clusterService.clusters(project.id, false).pipe(take(1)),
            project: of(project),
          })
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(({userGroup, backups, clusters, project}) => {
        this._selectedProject = project;
        this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);

        this._backups = backups;
        this.dataSource.data = this._backups;

        clusters.forEach(cluster => this._clusters.set(cluster.id, cluster));
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getStatus(backup: EtcdBackupConfig): HealthStatus {
    let condition = {} as EtcdBackupConfigCondition;
    if (backup.status?.conditions?.length === 1) {
      condition = backup.status.conditions[0];
    }

    return getBackupHealthStatus(backup, condition);
  }

  getClusterName(backup: EtcdBackupConfig): string {
    return this._clusters.get(backup.spec.clusterId)?.name ?? 'N/A';
  }

  delete(backup: EtcdBackupConfig): void {
    const config: MatDialogConfig = {
      data: {
        snapshot: backup,
        projectID: this._selectedProject.id,
      } as DeleteSnapshotDialogConfig,
    };

    const dialog = this._matDialog.open(DeleteSnapshotDialogComponent, config);
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._backupService.refreshSnapshots());
  }

  add(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
      } as AddSnapshotDialogConfig,
    };

    const dialog = this._matDialog.open(AddSnapshotDialogComponent, config);
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._backupService.refreshSnapshots());
  }

  goToDetails(backup: EtcdBackupConfig): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/backups/${View.Snapshots}/${backup.id}`]);
  }
}
