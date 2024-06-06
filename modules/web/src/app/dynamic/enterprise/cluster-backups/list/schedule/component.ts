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
import {ClusterService} from '@app/core/services/cluster';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {ProjectService} from '@app/core/services/project';
import {UserService} from '@app/core/services/user';
import {BackupType, ClusterBackup} from '@app/shared/entity/backup';
import {Cluster} from '@app/shared/entity/cluster';
import {View} from '@app/shared/entity/common';
import {Member} from '@app/shared/entity/member';
import {Project} from '@app/shared/entity/project';
import {GroupConfig} from '@app/shared/model/Config';
import {HealthStatus, getClusterBackupHealthStatus} from '@app/shared/utils/health-status';
import {MemberUtils, Permission} from '@app/shared/utils/member';
import {Subject, filter, forkJoin, switchMap, take, takeUntil} from 'rxjs';
import {DeleteBackupDialogComponent, DeleteBackupDialogConfig} from '../backups/delete-dialog/component';
import {AddClustersBackupsDialogComponent, AddClustersBackupsDialogConfig} from '../backups/add-dialog/component';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

enum ClusterState {
  Ready = 'Clusters',
  Loading = 'Loading...',
  Empty = 'No Clusters Available',
}

@Component({
  selector: 'km-cluster-schedule-backups-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClustersScheduleBackupsListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;
  isAdmin = false;
  dataSource = new MatTableDataSource<ClusterBackup>();
  clusters: Cluster[];
  clusterScheduleBackups: ClusterBackup[] = [];
  selectedScheduleBackups: ClusterBackup[] = [];
  selectAll: boolean = false;
  selectedCluster: Cluster;
  clusterBSL: string;
  loadingBackups: boolean = false;
  currentSearchfield: string;
  showRowDetails: Map<string, boolean> = new Map<string, boolean>();
  clusterLabel = ClusterState.Ready;
  columns: string[] = [
    'select',
    'status',
    'name',
    'labels',
    'cluster',
    'destination',
    'schedule',
    'namespaces',
    'created',
    'actions',
  ];
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
          this._getScheduleBackupsList(this._selectedProject.id);
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

  onSelectedScheduleBackup(backup: ClusterBackup): void {
    const isBackupSelected = this.selectedScheduleBackups.some(item => item.id === backup.id);
    if (isBackupSelected) {
      this.selectedScheduleBackups = this.selectedScheduleBackups.filter(item => item.id !== backup.id);
    } else {
      this.selectedScheduleBackups.push(backup);
    }
  }

  onSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedScheduleBackups = this.selectAll ? this.dataSource.data : [];
  }

  checkSelected(backupID: string): boolean {
    const isSelected = !!this.selectedScheduleBackups.some(backup => backup.id === backupID);
    if (isSelected && this.selectedScheduleBackups.length) {
      return true;
    }
    return false;
  }

  onClusterChange(clusterID: string): void {
    this.selectedCluster = this.clusters.find(cluster => clusterID === cluster.id);
    this._getCbslName();
    this._getScheduleBackupsList(this._selectedProject.id);
  }

  clusterDisplayFn(clusterID: string): string {
    return this.clusters?.find(cluster => cluster.id === clusterID)?.name ?? '';
  }

  onSearch(query: string): void {
    this.currentSearchfield = query;
    this.dataSource.data = this.clusterScheduleBackups.filter(clusterSchedule => clusterSchedule.name.includes(query));
    this.selectedScheduleBackups = [];
    this.selectAll = false;
  }

  getStatus(phase: string): HealthStatus {
    return getClusterBackupHealthStatus(phase);
  }

  toggelScheduleDetail(scheduleName: string): void {
    this.showRowDetails?.set(scheduleName, !this.showRowDetails?.get(scheduleName));
  }

  isScheduleToggeled(scheduleName: string): boolean {
    return this.showRowDetails?.get(scheduleName);
  }

  addScheduleBackup(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject?.id,
        type: BackupType.Schedule,
        cluster: this.selectedCluster,
        clusterBSL: this.clusterBSL,
      } as AddClustersBackupsDialogConfig,
    };
    this._matDialog
      .open(AddClustersBackupsDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._getScheduleBackupsList(this._selectedProject.id));
  }

  deleteScheduleBackups(scheduleBackups: ClusterBackup[]): void {
    const config: MatDialogConfig = {
      data: {
        backups: scheduleBackups,
        type: BackupType.Schedule,
      } as DeleteBackupDialogConfig,
    };
    this._matDialog
      .open(DeleteBackupDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(
        switchMap(_ =>
          forkJoin(
            scheduleBackups.map(schedule => {
              return this._clusterBackupService.deleteSchedule(
                this._selectedProject.id,
                schedule.spec.clusterid,
                schedule.name
              );
            })
          )
        )
      )
      .subscribe(_ => {
        this.selectedScheduleBackups = [];
        this.selectAll = false;
        if (scheduleBackups.length > 1) {
          this._notificationService.success('Deleting the selected schedule backups');
        } else {
          this._notificationService.success(`Deleting the ${scheduleBackups[0].name} schedule backup)}`);
        }
      });
  }

  private _getCbslName(): void {
    // This method returns the name of the CBSL in the seed cluster that was used during cluster creation.
    const cbslNameArr = this.selectedCluster.spec.backupConfig.backupStorageLocation.name.split('-');
    cbslNameArr.pop();
    this.clusterBSL = cbslNameArr.join('-');
  }

  private _getClusters(projectID: string): void {
    this.clusterLabel = ClusterState.Loading;
    this._clusterService
      .clusters(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => {
        this.clusters = clusters.filter(cluster => cluster.spec.backupConfig);
        if (!this.selectedCluster) {
          this.selectedCluster = this.clusters[0];
          this._getScheduleBackupsList(this._selectedProject.id);
        }
        this.clusterLabel = clusters.length ? ClusterState.Ready : ClusterState.Empty;
      });
  }

  private _getScheduleBackupsList(projectID: string): void {
    if (this.selectedCluster) {
      this.loadingBackups = true;
      this._clusterBackupService
        .listClusterScheduleBackups(projectID, this.selectedCluster.id)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(data => {
          this.clusterScheduleBackups = data;
          if (this.currentSearchfield) {
            this.dataSource.data = data.filter(clusterSchedule =>
              clusterSchedule.name.includes(this.currentSearchfield)
            );
          } else {
            this.dataSource.data = data;
          }
          this.dataSource.data.map(schedule => {
            if (!this.showRowDetails?.get(schedule.name)) {
              this.showRowDetails?.set(schedule.name, false);
            }
          });
          this.loadingBackups = false;
        });
    } else {
      this.clusterScheduleBackups = [];
      this.dataSource.data = [];
    }
  }
}
