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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import _ from 'lodash';
import {merge, Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {DynamicTab} from '@shared/model/dynamic-tab';
import {ProjectGroupBindingService} from '@app/dynamic/enterprise/project-groups/service';
import {GroupProjectBinding} from '@app/dynamic/enterprise/project-groups/entity';
import {EditGroupDialogComponent} from '@app/dynamic/enterprise/project-groups/edit-group-dialog/component';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {NotificationService} from '@core/services/notification';
import {GoogleAnalyticsService} from '@app/google-analytics.service';

// @ts-ignore
enum Mode {
  Add = 'add',
  Edit = 'edit',
}

enum Column {
  Group = 'group',
  Role = 'role',
  Actions = 'actions',
}

@Component({
  selector: 'km-project-group-bindings-list',
  templateUrl: './template.html',
})
export class ProjectGroupBindingsComponent extends DynamicTab implements OnInit, OnChanges, OnDestroy {
  readonly column = Column;
  readonly displayedColumns: string[] = Object.values(Column);
  private readonly _googleAnalyticsEventCategory = 'memberOverview';
  private _unsubscribe = new Subject<void>();
  private _selectedProject: Project;

  dataSource = new MatTableDataSource<GroupProjectBinding>();
  isLoadingGroupBindings = true;
  currentUser: Member;
  groupProjectBindings: GroupProjectBinding[] = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _projectService: ProjectService,
    private readonly _projectGroupBindingService: ProjectGroupBindingService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {
    super();
  }

  ngOnChanges(): void {
    this.dataSource.data = this.groupProjectBindings;
  }

  ngOnInit(): void {
    this.dataSource.data = this.groupProjectBindings;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      !_.isEmpty(this.groupProjectBindings) &&
      this.paginator &&
      this.groupProjectBindings.length > this.paginator.pageSize
    );
  }

  getEditTooltip(groupProjectBinding: GroupProjectBinding): string {
    // Todo: Fix checks
    return this.currentUser && groupProjectBinding && this.currentUser.name === groupProjectBinding.name
      ? 'You cannot edit your own data and permissions'
      : 'Edit group';
  }

  getDeleteTooltip(groupProjectBinding: GroupProjectBinding): string {
    // Todo: Fix checks
    return this.currentUser && groupProjectBinding && this.currentUser.name === groupProjectBinding.name
      ? 'You cannot edit your own data and permissions'
      : 'Remove group';
  }

  editGroupBinding(groupProjectBinding: GroupProjectBinding): void {
    const modal = this._matDialog.open(EditGroupDialogComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.groupProjectBinding = groupProjectBinding;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(isEdited => {
        if (isEdited) {
          this._projectGroupBindingService.refreshProjectGroupBindings();
        }
      });
  }

  deleteGroupBinding(groupProjectBinding: GroupProjectBinding): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Remove Group',
        message: `Remove <b>${groupProjectBinding.group}</b> from <b>${this._selectedProject.name}</b> project?`,
        confirmLabel: 'Remove',
      },
    };

    this._googleAnalyticsService.emitEvent(this._googleAnalyticsEventCategory, 'deleteGroupDialogOpened');
    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._projectGroupBindingService.remove(groupProjectBinding, this._selectedProject.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `Removed the ${groupProjectBinding.group} group from the ${this._selectedProject.name} project`
        );
        this._projectGroupBindingService.refreshProjectGroupBindings();
        this._googleAnalyticsService.emitEvent(this._googleAnalyticsEventCategory, 'GroupDeleted');
      });
  }

  private _initSubscriptions(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.currentUser = user));
    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    merge(this._projectService.selectedProject, this._projectService.onProjectsUpdate)
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap((project: Project) => {
          this._selectedProject = project;
          return this._projectGroupBindingService.projectGroupsBindings(project.id);
        })
      )
      .subscribe((groupBindings: GroupProjectBinding[]) => {
        this.groupProjectBindings = groupBindings;
        this.dataSource.data = this.groupProjectBindings;
      });
  }
}
