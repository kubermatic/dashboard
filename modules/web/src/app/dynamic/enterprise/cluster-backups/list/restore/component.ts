//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {BackupType, ClusterRestore} from '@app/shared/entity/backup';
import {DeleteRestoreDialogComponent, DeleteRestoreDialogConfig} from './delete-dialog/component';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {ProjectService} from '@app/core/services/project';
import {Subject, filter, forkJoin, switchMap, take, takeUntil} from 'rxjs';
import {Project} from '@app/shared/entity/project';
import {ClusterService} from '@app/core/services/cluster';
import {Cluster} from '@app/shared/entity/cluster';
import {NotificationService} from '@app/core/services/notification';
import {MemberUtils, Permission} from '@app/shared/utils/member';
import {Member} from '@app/shared/entity/member';
import {GroupConfig} from '@app/shared/model/Config';
import {View} from '@app/shared/entity/common';
import {UserService} from '@app/core/services/user';
import {HealthStatus, StatusIcon, getClusterBackupHealthStatus} from '@app/shared/utils/health-status';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

enum ClusterState {
  Ready = 'Clusters',
  Loading = 'Loading...',
  Empty = 'No Clusters Available',
}

@Component({
    selector: 'km-cluster-restore-list',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
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
  loadingRestores: boolean = false;
  currentSearchfield: string;
  showRowDetails: Map<string, boolean> = new Map<string, boolean>();
  clusterLabel = ClusterState.Ready;
  columns: string[] = ['select', 'status', 'name', 'cluster', 'backupName', 'namespaces', 'created', 'actions'];
  toggleableColumn: string[] = ['nameSpacesDetails'];

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

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
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.direction = 'asc';
    this.sort.active = 'name';

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => {
      this.isAdmin = user.isAdmin;
      this._user = user;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
    });

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._getClusters(this._selectedProject.id);
          this._getRestoreList(this._selectedProject.id);
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

  checkSelected(restoreID: string): boolean {
    const isSelected = this.selectedRestores.some(restore => restore.id === restoreID);
    if (isSelected && this.selectedRestores.length) {
      return true;
    }
    return false;
  }

  onClusterChange(clusterID: string): void {
    this.selectedCluster = clusterID;
    this._getRestoreList(this._selectedProject.id);
  }

  clusterDisplayFn(clusterID: string): string {
    return this.clusters?.find(cluster => cluster.id === clusterID)?.name ?? '';
  }

  onSearch(query: string): void {
    this.currentSearchfield = query;
    this.dataSource.data = this.clusterRestores.filter(clusterbackup => clusterbackup.name.includes(query));
    this.selectedRestores = [];
    this.selectAll = false;
  }

  getStatus(phase: string, restoreName?: string): HealthStatus {
    const status = getClusterBackupHealthStatus(phase);
    if (
      (status.icon === StatusIcon.Error && status.message !== 'Deleting') ||
      status.icon === StatusIcon.Warning ||
      status.icon === StatusIcon.Unknown
    ) {
      status.message = `${status.message}. Run "velero ${BackupType.Restore.toLowerCase()} logs ${restoreName}" for more information`;
    }
    return status;
  }

  toggleRestoreDetail(backupName: string): void {
    this.showRowDetails?.set(backupName, !this.showRowDetails?.get(backupName));
  }

  isRestoreToggled(backupName: string): boolean {
    return this.showRowDetails?.get(backupName);
  }

  deleteRestores(restores: ClusterRestore[]): void {
    const config: MatDialogConfig = {
      data: {
        restores,
      } as DeleteRestoreDialogConfig,
    };
    this._matDialog
      .open(DeleteRestoreDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(
        switchMap(_ =>
          forkJoin(
            restores.map(restore =>
              this._clusterBackupService.deleteRestore(this._selectedProject.id, restore.spec.clusterid, restore.name)
            )
          )
        )
      )
      .subscribe(_ => {
        this.selectedRestores = [];
        this.selectAll = false;
        if (restores.length > 1) {
          this._notificationService.success('Deleting the selected restores');
        } else {
          this._notificationService.success(`Deleting the ${restores[0].name} restore`);
        }
      });
  }

  private _getClusters(projectID: string): void {
    this.clusterLabel = ClusterState.Loading;
    this._clusterService
      .clusters(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => {
        this.clusters = clusters.filter(cluster => cluster.spec.backupConfig);
        if (!this.selectedCluster) {
          this.selectedCluster = this.clusters[0]?.id;
          this._getRestoreList(this._selectedProject.id);
        }
        this.clusterLabel = clusters.length ? ClusterState.Ready : ClusterState.Empty;
      });
  }

  private _getRestoreList(projectID: string): void {
    if (this.selectedCluster) {
      this.loadingRestores = true;

      this._clusterBackupService
        .listRestore(projectID, this.selectedCluster)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(data => {
          this.clusterRestores = data;
          if (this.currentSearchfield) {
            this.dataSource.data = data.filter(clusterbackup => clusterbackup.name.includes(this.currentSearchfield));
          } else {
            this.dataSource.data = data;
          }
          this.dataSource.data.map(restore => {
            if (!this.showRowDetails?.get(restore.name)) {
              this.showRowDetails?.set(restore.name, false);
            }
          });
          this.loadingRestores = false;
        });
    } else {
      this.clusterRestores = [];
      this.dataSource.data = [];
    }
  }
}
