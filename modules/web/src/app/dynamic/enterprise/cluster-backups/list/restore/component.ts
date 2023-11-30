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
import {MatTableDataSource} from '@angular/material/table';
import {ClusterRestore} from '@app/shared/entity/backup';
import {DeleteRestoreDialogComponent} from './delete-dialog/component';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {ProjectService} from '@app/core/services/project';
import {Subject, filter, switchMap, take, takeUntil} from 'rxjs';
import {Project} from '@app/shared/entity/project';
import {ClusterService} from '@app/core/services/cluster';
import {Cluster} from '@app/shared/entity/cluster';
import { NotificationService } from '@app/core/services/notification';
import { MemberUtils, Permission } from '@app/shared/utils/member';
import { Member } from '@app/shared/entity/member';
import { GroupConfig } from '@app/shared/model/Config';
import { View } from '@app/shared/entity/common';
import { UserService } from '@app/core/services/user';

@Component({
  selector: 'km-cluster-restore-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClustersRestoresListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;
  isAdmin = false;
  dataSource = new MatTableDataSource<ClusterRestore>();
  clusters: Cluster[];
  clusterRestores: ClusterRestore[];
  selectedRestores: ClusterRestore[] = [];
  selectAll: boolean = false;
  selectedCluster: string;
  loadingRestores: boolean = false

  get columns(): string[] {
    return ['select', 'name', 'cluster', 'backupName', 'restored', 'created', 'actions'];
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

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._getRestoreList(this._selectedProject.id);
          this._getClusters(this._selectedProject.id);
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

  onSelectedRestore(restore: ClusterRestore): void {
    const isRestoreSelected = this.selectedRestores.some(item => item.id === restore.id);
    if (isRestoreSelected) {
      this.selectedRestores = this.selectedRestores.filter(item => item.id !== restore.id);
    } else {
      this.selectedRestores.push(restore);
    }
  }

  onSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedRestores = this.selectAll ? this.dataSource.data : [];
  }

  // check in the HTML file can i apply this method on the row instead of each element in the table
  checkSelected(restoreID: string): boolean {
    const isSelected = this.selectedRestores.some(restore => restore.id === restoreID);
    if (isSelected && this.selectedRestores.length) {
      return true;
    }
    return false;
  }

  onRestoreChange(clusterID: string): void {
    this.selectedCluster = clusterID;
    this._getRestoreList(this._selectedProject.id);
  }

  clusterDisplayFn(clusterID: string): string {
    return this.clusters?.find(cluster => cluster.id === clusterID)?.name ?? '';
  }

  deleteRestores(restores: ClusterRestore[]): void {
    const config: MatDialogConfig = {
      data: {
        restores,
      },
    };
    this._matDialog
      .open(DeleteRestoreDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(
        switchMap(_ =>
          restores.map(restore =>
            this._clusterBackupService.deleteRestore(
             this._selectedProject.id,
             restore.spec.clusterid,
             restore.name
           ))
        )
      )
      .subscribe(res => {
        res.subscribe();
        this.selectedRestores = [];
        if (restores.length > 1) {
          this._notificationService.success('Deleting the selected restores')
        } else {
          this._notificationService.success(`Deleting the ${restores[0].name} restore`)
        }
      });
  }

  private _getClusters(projectID: string): void {
    this._clusterService
      .clusters(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));
  }

  private _getRestoreList(projectID: string): void {
    if (this.selectedCluster) {
      this.loadingRestores = true

      this._clusterBackupService
      .listRestore(projectID, this.selectedCluster)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.clusterRestores = data
        this.dataSource.data = data
        this.loadingRestores = false
      });
    } else {
      this.clusterRestores = [];
        this.dataSource.data = [];
    }
  }
}
