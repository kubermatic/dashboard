//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
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
import {MatLegacyPaginator as MatPaginator} from '@angular/material/legacy-paginator';
import {MatSort} from '@angular/material/sort';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {Project} from '@shared/entity/project';
import _ from 'lodash';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {DynamicTab} from '@shared/model/dynamic-tab';
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {GroupService} from '@app/dynamic/enterprise/group/service';
import {Group} from '@app/dynamic/enterprise/group/entity';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {AddGroupDialogComponent} from './add-group-dialog/component';
import {EditGroupDialogComponent} from './edit-group-dialog/component';
import {AppConfigService} from '@app/config.service';
import {MemberUtils, Permission} from '@shared/utils/member';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {GroupConfig} from '@shared/model/Config';

enum Column {
  Group = 'group',
  Role = 'role',
  Actions = 'actions',
}

@Component({
  selector: 'km-group',
  templateUrl: './template.html',
})
export class GroupComponent extends DynamicTab implements OnInit, OnDestroy {
  readonly column = Column;
  readonly displayedColumns: string[] = Object.values(Column);

  currentUser: Member;
  groups: Group[] = [];
  dataSource = new MatTableDataSource<Group>();
  isInitializingGroups = true;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private readonly _refreshTime = 10;
  private readonly _googleAnalyticsEventCategory = 'groupOverview';
  private _currentGroupConfig: GroupConfig;
  private _groupsUpdate = new Subject<void>();
  private _unsubscribe = new Subject<void>();
  private _selectedProject: Project;

  constructor(
    private readonly _appConfig: AppConfigService,
    private readonly _matDialog: MatDialog,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.dataSource.data = this.groups;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = Column.Group;
    this.sort.direction = 'asc';

    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addGroup(): void {
    const modal = this._matDialog.open(AddGroupDialogComponent);
    modal.componentInstance.project = this._selectedProject;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe((group: Group) => {
        if (group) {
          this.groups.push(group);
          this._groupsUpdate.next();
        }
      });
  }

  editGroup(group: Group): void {
    const modal = this._matDialog.open(EditGroupDialogComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.group = group;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe((isEdited: boolean) => {
        if (isEdited) {
          this._groupsUpdate.next();
        }
      });
  }

  deleteGroup(group: Group): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Remove Group',
        message: `Remove <b>${group.group}</b> group from <b>${this._selectedProject.name}</b> project?`,
        confirmLabel: 'Remove',
      },
    };

    this._googleAnalyticsService.emitEvent(this._googleAnalyticsEventCategory, 'deleteGroupDialogOpened');
    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter((isConfirmed: boolean) => isConfirmed))
      .pipe(switchMap(_ => this._groupService.remove(this._selectedProject.id, group.name)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `Removed the ${group.group} group from the ${this._selectedProject.name} project.`
        );
        this._groupsUpdate.next();
        this._googleAnalyticsService.emitEvent(this._googleAnalyticsEventCategory, 'GroupDeleted');
      });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.groups) && this.paginator && this.groups.length > this.paginator.pageSize;
  }

  isAddEnabled(): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Create);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Edit);
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Delete);
  }

  private _initSubscriptions(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.currentUser = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;
    });

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._groupsUpdate.next();
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(take(1))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    merge(timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase()), this._groupsUpdate)
      .pipe(switchMap(() => (this._selectedProject ? this._groupService.list(this._selectedProject.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((groups: Group[]) => {
        this.groups = groups;
        this.dataSource.data = this.groups;
        this.isInitializingGroups = false;
      });
  }
}
