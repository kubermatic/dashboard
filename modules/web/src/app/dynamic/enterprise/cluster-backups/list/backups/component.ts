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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {AddClustersBackupsDialogComponent, BackupType} from './add-dialog/component';
import {UserService} from '@app/core/services/user';
import {Subject, filter, forkJoin, switchMap, take, takeUntil} from 'rxjs';
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
import {View} from '@app/shared/entity/common';
import {NotificationService} from '@app/core/services/notification';
import {HealthStatus, getClusterBackupHealthStatus} from '@app/shared/utils/health-status';

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
  readonly backupType = BackupType;
  isAdmin = false;
  dataSource = new MatTableDataSource<ClusterBackup>();
  clusters: Cluster[];
  clusterBackups: ClusterBackup[] = [];
  selectedBackups: ClusterBackup[] = [];
  selectAll: boolean = false;
  selectedCluster: string;
  loadingBackups: boolean = false;
  currentSearchfield: string;
  showRowDetails: Map<string, boolean> = new Map<string, boolean>();

  get columns(): string[] {
    return ['select', 'status', 'name', 'labels', 'cluster', 'destination', 'TTL', 'namespaces', 'created', 'actions'];
  }

  get toggleableColumn(): string[] {
    return ['nameSpacesDetails'];
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
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.isAdmin = user.isAdmin));

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._getClusters(this._selectedProject.id);
          this._getBackupsList(this._selectedProject.id);
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

  checkSelected(backupID: string): boolean {
    const isSelected = !!this.selectedBackups.some(backup => backup.id === backupID);
    if (isSelected && this.selectedBackups.length) {
      return true;
    }
    return false;
  }

  onClusterChange(clusterID: string): void {
    this.selectedCluster = clusterID;
    this._getBackupsList(this._selectedProject.id);
  }

  clusterDisplayFn(clusterID: string): string {
    return this.clusters?.find(cluster => cluster.id === clusterID)?.name ?? '';
  }

  onSearch(query: string): void {
    this.currentSearchfield = query;
    this.dataSource.data = this.clusterBackups.filter(clusterbackup => clusterbackup.name.includes(query));
    this.selectedBackups = [];
    this.selectAll = false;
  }

  getStatus(phase: string): HealthStatus {
    return getClusterBackupHealthStatus(phase);
  }

  toggelBackupDetail(backupName: string): void {
    this.showRowDetails?.set(backupName, !this.showRowDetails?.get(backupName));
  }

  isBackupToggeled(backupName: string): boolean {
    return this.showRowDetails?.get(backupName);
  }

  addBackup(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject?.id,
        type: BackupType.Backup,
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
      .pipe(
        switchMap(_ =>
          forkJoin(
            backups.map(backup => {
              return this._clusterBackupService.delete(this._selectedProject.id, backup.spec.clusterid, backup.name);
            })
          )
        )
      )
      .subscribe(_ => {
        this.selectedBackups = [];
        this.selectAll = false;
        if (backups.length > 1) {
          this._notificationService.success('Deleting the selected backups');
        } else {
          this._notificationService.success(`Deleting the ${backups[0].name} backup`);
        }
      });
  }

  private _getClusters(projectID: string): void {
    this._clusterService
      .clusters(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => {
        this.clusters = clusters;
        if (!this.selectedCluster) {
          this.selectedCluster = clusters[0].id;
          this._getBackupsList(this._selectedProject.id);
        }
      });
  }

  private _getBackupsList(projectID: string): void {
    if (this.selectedCluster) {
      this.loadingBackups = true;
      this._clusterBackupService
        .listClusterBackups(projectID, this.selectedCluster)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(data => {
          this.clusterBackups = data;
          if (this.currentSearchfield) {
            this.dataSource.data = data.filter(clusterbackup => clusterbackup.name.includes(this.currentSearchfield));
          } else {
            this.dataSource.data = data;
          }
          this.dataSource.data.map(backup => {
            if (!this.showRowDetails?.get(backup.name)) {
              this.showRowDetails?.set(backup.name, false);
            }
          });
          this.loadingBackups = false;
        });
    } else {
      this.clusterBackups = [];
      this.dataSource.data = [];
    }
  }
}
