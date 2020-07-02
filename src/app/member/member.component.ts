import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import * as _ from 'lodash';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {filter, first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Member} from '../shared/entity/member';
import {View} from '../shared/entity/common';
import {Project} from '../shared/entity/project';
import {GroupConfig} from '../shared/model/Config';
import {MemberUtils, Permission} from '../shared/utils/member-utils/member-utils';

import {AddMemberComponent} from './add-member/add-member.component';
import {EditMemberComponent} from './edit-member/edit-member.component';

@Component({
  selector: 'km-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss'],
})
export class MemberComponent implements OnInit, OnChanges, OnDestroy {
  members: Member[] = [];
  isInitializing = true;
  currentUser: Member;
  displayedColumns: string[] = ['name', 'email', 'group', 'actions'];
  dataSource = new MatTableDataSource<Member>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe: Subject<any> = new Subject();
  private _membersUpdate: Subject<any> = new Subject();
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _appConfig: AppConfigService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.members;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._userService.loggedInUser.pipe(first()).subscribe(user => (this.currentUser = user));

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        })
      )
      .pipe(first())
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));

    merge(timer(0, 10 * this._appConfig.getRefreshTimeBase()), this._membersUpdate)
      .pipe(switchMap(() => (this._selectedProject ? this._apiService.getMembers(this._selectedProject.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(members => {
        this.members = members;
        this.dataSource.data = this.members;
        this.isInitializing = false;
      });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.members;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getGroup(member: Member): string {
    return this._selectedProject
      ? MemberUtils.getGroupDisplayName(MemberUtils.getGroupInProject(member, this._selectedProject.id))
      : '';
  }

  isAddEnabled(): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Create);
  }

  addMember(): void {
    const modal = this._matDialog.open(AddMemberComponent);
    modal.componentInstance.project = this._selectedProject;
    modal
      .afterClosed()
      .pipe(first())
      .subscribe((member: Member) => {
        if (member) {
          this.members.push(member);
          this._membersUpdate.next();
        }
      });
  }

  isEditEnabled(member: Member): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Edit) ||
      (this.currentUser && member && this.currentUser.email !== member.email)
    );
  }

  editMember(member: Member): void {
    const modal = this._matDialog.open(EditMemberComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.member = member;
    modal
      .afterClosed()
      .pipe(first())
      .subscribe(isEdited => {
        if (isEdited) {
          this._membersUpdate.next();
        }
      });
  }

  isDeleteEnabled(member: Member): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Delete) ||
      (this.currentUser && member && this.currentUser.email !== member.email)
    );
  }

  deleteMember(member: Member): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Member',
        message: `Delete member "<strong>${member.name}</strong>" from project "<strong>${this._selectedProject.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._apiService.deleteMembers(this._selectedProject.id, member)))
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `The <strong>${member.name}</strong> member was removed from the <strong>${this._selectedProject.name}</strong> project`
        );
        this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
      });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.members) && this.paginator && this.members.length > this.paginator.pageSize;
  }
}
