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
import {Subject, filter, switchMap, take, takeUntil} from 'rxjs';
import {MemberUtils, Permission} from '@app/shared/utils/member';
import {Member} from '@app/shared/entity/member';
import {GroupConfig} from '@shared/model/Config';
import {ProjectService} from '@core/services/project';
import {Project} from '@shared/entity/project';
import {MatTableDataSource} from '@angular/material/table';
import {ClusterBackup} from '@app/shared/entity/backup';
import {DeleteBackupDialogComponent} from './delete-dialog/component';
import {AddRestoreDialogComponent} from '../restore/add-dialog/component';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {Cluster} from '@app/shared/entity/cluster';
import {ClusterService} from '@app/core/services/cluster';
import { View } from '@app/shared/entity/common';
import { NotificationService } from '@app/core/services/notification';

@Component({
  selector: 'km-cluster-backups-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClustersBackupsListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;
  isAdmin = false;
  dataSource = new MatTableDataSource<ClusterBackup>();
  clusters: Cluster[];
  allBackups: ClusterBackup[] = [];
  selectedBackups: ClusterBackup[] = [];
  selectAll: boolean = false;
  currentFilter: string;

  get columns(): string[] {
    return ['select', 'name', 'labels', 'cluster', 'destination', 'schedule', 'namespaces', 'created', 'actions'];
  }

  get canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.ClusterBackup, Permission.Create);
  }

  get canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.ClusterBackup, Permission.Delete);
  }

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _projectService: ProjectService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _clusterService: ClusterService,
    private readonly _notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._projectService.selectedProject.pipe(switchMap(project => {
      this._selectedProject = project;
      !this.allBackups.length && this._getBackupsList(this._selectedProject.id);
      this._getClusters(this._selectedProject.id);
      return this._userService.getCurrentUserGroup(project.id);
    }))
    .pipe(takeUntil(this._unsubscribe))
    .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSelectedBackup(backup: ClusterBackup): void {
    const isBackupSelected = this.selectedBackups.some(item => item.id === backup.id);
    if (isBackupSelected) {
      this.selectedBackups = this.selectedBackups.filter(item => item.id !== backup.id);
    } else {
      this.selectedBackups.push(backup);
    }
  }

  onSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedBackups = this.selectAll ? this.dataSource.data : [];
  }

  // check in the HTML file can i apply this method on the row instead of each element in the table
  checkSelected(backupID: string): boolean {
    const isSelected = !!this.selectedBackups.some(backup => backup.id === backupID);
    if (isSelected && this.selectedBackups.length) {
      return true;
    }
    return false;
  }

  onFilterChange(clusterID: string): void {
    this.currentFilter = clusterID;
    this.dataSource.data = clusterID
      ? this.allBackups.filter(backup => backup.spec.clusterid === clusterID)
      : this.allBackups;
  }

  clusterDisplayFn(clusterID: string): string {
    return this.clusters?.find(cluster => cluster.id === clusterID)?.name ?? '';
  }

  add(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject?.id,
      },
    };
    this._matDialog
      .open(AddClustersBackupsDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._getBackupsList(this._selectedProject.id));
  }

  restoreBackup(backup: ClusterBackup): void {
    const config: MatDialogConfig = {
      data: {
        backup,
        projectID: this._selectedProject?.id,
      },
    };
    this._matDialog.open(AddRestoreDialogComponent, config);
  }

  deleteBackups(backups: ClusterBackup[]): void {
    const config: MatDialogConfig = {
      data: {
        backups,
      },
    };
    this._matDialog
      .open(DeleteBackupDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(switchMap(_ => backups.map(backup => this._clusterBackupService.delete(this._selectedProject.id, backup.spec.clusterid, backup.name))))
      .subscribe(res => {
        res.subscribe()
        this.selectedBackups = []
        if (backups.length > 1) {
        this._notificationService.success(`Deleting the selected cluster backups`);
        } else {
          this._notificationService.success(`Deleting the ${backups[0].name} cluster backup`);
        }
      });
  }

  private _getClusters(projectID: string): void {
    this._clusterService
      .clusters(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));
  }

  private _getBackupsList(projectID: string): void {
    this.allBackups = []
    this.clusters?.map(cluster => {
      this._clusterBackupService
        .listClusterBackups(projectID, cluster.id)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(data => {
          this.allBackups = this.allBackups.concat(...data);
          this.dataSource.data = this.currentFilter
            ? this.allBackups.filter(backup => backup.spec.clusterid === this.currentFilter)
            : this.allBackups;
        });

    })
  }
}
