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

@Component({
  selector: 'km-cluster-restore-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClustersRestoresListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  dataSource = new MatTableDataSource<ClusterRestore>();
  clusters: Cluster[];
  allRestores: ClusterRestore[];
  selectedRestores: ClusterRestore[] = [];
  selectAll: boolean = false;
  selectedProject: Project;
  currentFilter: string;

  get columns(): string[] {
    return ['select', 'name', 'cluster', 'backupName', 'restored', 'created', 'actions'];
  }

  get canAdd(): boolean {
    return true;
  }

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _projectService: ProjectService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _clusterService: ClusterService
  ) {}

  ngOnInit(): void {
    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe)).subscribe(project => {
      this.selectedProject = project;
      this._getClusters(project.id);
      this._getRestoreList(project.id);
    });
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

  onFilterChange(clusterID: string): void {
    this.currentFilter = clusterID;
    this.dataSource.data = clusterID
      ? this.allRestores.filter(restore => restore.spec.clusterid === clusterID)
      : this.allRestores;
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
        switchMap(_ => {
          const restoreIDs = restores.map(restore => restore.id);
          return this._clusterBackupService.deleteRestore(
            this.selectedProject.id,
            restores[0].spec.clusterid,
            restoreIDs
          );
        })
      )
      .subscribe();
  }

  private _getClusters(projectID: string): void {
    this._clusterService
      .clusters(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));
  }

  private _getRestoreList(projectID: string): void {
    this._clusterBackupService
      .listRestore(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.allRestores = data;
        this.dataSource.data = this.currentFilter
          ? data.filter(restore => restore.spec.clusterid === this.currentFilter)
          : data;
      });
  }
}
