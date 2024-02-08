//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2024 Kubermatic GmbH
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
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ProjectService} from '@app/core/services/project';
import {BackupStorageLocation, BackupType} from '@app/shared/entity/backup';
import {Project} from '@app/shared/entity/project';
import {Subject, filter, switchMap, take, takeUntil} from 'rxjs';
import {AddBackupStorageLocationDialogComponent, AddBackupStorageLocationDialogConfig} from './add-dialog/component';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {UserService} from '@app/core/services/user';
import {Member} from '@app/shared/entity/member';
import {MemberUtils, Permission} from '@app/shared/utils/member';
import {View} from '@app/shared/entity/common';
import {GroupConfig} from '@app/shared/model/Config';
import {DeleteBackupDialogComponent} from '../backups/delete-dialog/component';
import {NotificationService} from '@app/core/services/notification';
import {HealthStatus, getClusterBackupHealthStatus} from '@app/shared/utils/health-status';

@Component({
  selector: 'km-backup-storage-locations-list',
  templateUrl: './template.html',
})
export class BackupStorageLocationsListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _selectedProject: Project;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  isAdmin = false;
  dataSource = new MatTableDataSource<BackupStorageLocation>();
  backupStorageLocations: BackupStorageLocation[] = [];
  columns = ['status', 'name', 'bucket', 'region', 'validation', 'actions'];

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
          this._getBackupStorageLocationList(project.id);
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

  getStatus(phase: string): HealthStatus {
    return getClusterBackupHealthStatus(phase);
  }

  addBackupStorageLocation(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
      } as AddBackupStorageLocationDialogConfig,
    };
    this._matDialog
      .open(AddBackupStorageLocationDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => {
        this._getBackupStorageLocationList(this._selectedProject.id);
      });
  }

  editBSL(bsl: BackupStorageLocation): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
        bslObject: bsl,
      } as AddBackupStorageLocationDialogConfig,
    };
    this._matDialog
      .open(AddBackupStorageLocationDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => {
        this._getBackupStorageLocationList(this._selectedProject.id);
      });
  }

  deleteBSL(bsl: BackupStorageLocation): void {
    const config: MatDialogConfig = {
      data: {
        bslName: bsl.displayName,
        type: BackupType.BackupStorageLocation,
      },
    };
    this._matDialog
      .open(DeleteBackupDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(
        switchMap(_ => {
          return this._clusterBackupService.deleteBackupStorageLocation(this._selectedProject.id, bsl.name);
        })
      )
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${bsl.name} backup storage location`);
      });
  }

  private _getBackupStorageLocationList(projectID: string): void {
    this._clusterBackupService
      .listBackupStorageLocation(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.backupStorageLocations = data;
        this.dataSource.data = this.backupStorageLocations;
      });
  }
}
