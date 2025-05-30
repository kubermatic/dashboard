// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {MemberService} from '@core/services/member';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {EMPTY, Subject, merge, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {AddMemberComponent} from './add-member/component';
import {EditMemberComponent} from './edit-member/component';

@Component({
  selector: 'km-member',
  templateUrl: './template.html',
  standalone: false,
})
export class MemberComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  readonly view = View;
  members: Member[] = [];
  isInitializing = true;
  currentUser: Member;
  displayedColumns: string[] = ['name', 'email', 'group', 'actions'];
  dataSource = new MatTableDataSource<Member>();
  urlPath = '';
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  private readonly _refreshTime = 10;
  private _unsubscribe = new Subject<void>();
  private _membersUpdate = new Subject<void>();
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _memberService: MemberService,
    private readonly _projectService: ProjectService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _appConfig: AppConfigService,
    private readonly _notificationService: NotificationService,
    private _router: Router,
    private _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.members;
    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => {
      this.currentUser = user;
      if (this._paginator) {
        this._paginator.pageSize = user.userSettings.itemsPerPage;
        this.dataSource.paginator = this._paginator; // Force refresh.
      }
    });

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._membersUpdate.next();
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(take(1))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    merge(timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase()), this._membersUpdate)
      .pipe(switchMap(() => (this._selectedProject ? this._memberService.list(this._selectedProject.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(members => {
        this.members = members;
        this.dataSource.data = this.members;
        this.isInitializing = false;
      });

    this.getURLPath();
  }

  ngOnChanges(): void {
    this.dataSource.data = this.members;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngAfterViewInit(): void {
    if (this._paginator && this._sort) {
      this._paginator.pageSize = this.currentUser.userSettings?.itemsPerPage;
      this.dataSource.paginator = this._paginator;
      this._sort.active = 'name';
      this._sort.direction = 'asc';
      this.dataSource.sort = this._sort;
    }
    this._cdr.detectChanges();
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
      .pipe(take(1))
      .subscribe((member: Member) => {
        if (member) {
          this.members.push(member);
          this._membersUpdate.next();
        }
      });
  }

  isEditEnabled(member: Member): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Edit) &&
      this.currentUser &&
      member &&
      this.currentUser.email !== member.email
    );
  }

  getEditTooltip(member: Member): string {
    return this.currentUser && member && this.currentUser.email === member.email
      ? 'You cannot edit your own data and permissions'
      : 'Edit member';
  }

  editMember(member: Member): void {
    this._dialogModeService.isEditDialog = true;
    const modal = this._matDialog.open(EditMemberComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.member = member;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(isEdited => {
        if (isEdited) {
          this._membersUpdate.next();
        }
      });
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  isDeleteEnabled(member: Member): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Delete) &&
      this.currentUser &&
      member &&
      this.currentUser.email !== member.email
    );
  }

  getDeleteTooltip(member: Member): string {
    return this.currentUser && member && this.currentUser.email === member.email
      ? 'You cannot edit your own data and permissions'
      : 'Remove member';
  }

  deleteMember(member: Member): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Remove Member',
        message: `Remove <b>${_.escape(member.name)}</b> from <b>${_.escape(this._selectedProject.name)}</b> project?`,
        confirmLabel: 'Remove',
      },
    };

    this._googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._memberService.remove(member, this._selectedProject.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `Removed the ${member.name} member from the ${this._selectedProject.name} project`
        );
        this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
      });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.members) && this._paginator && this.members.length > this._paginator.pageSize;
  }

  getURLPath(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');

    this.urlPath = urlArray[urlArray.length - 1];
  }
}
