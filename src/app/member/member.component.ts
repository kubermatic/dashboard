import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import * as _ from 'lodash';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity} from '../shared/entity/MemberEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
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
  members: MemberEntity[] = [];
  isInitializing = true;
  currentUser: MemberEntity;
  displayedColumns: string[] = ['name', 'email', 'group', 'actions'];
  dataSource = new MatTableDataSource<MemberEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe: Subject<any> = new Subject();
  private _membersUpdate: Subject<any> = new Subject();
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: ProjectEntity;

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _matDialog: MatDialog, private readonly _userService: UserService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _appConfig: AppConfigService,
      private readonly _notificationService: NotificationService, private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this.dataSource.data = this.members;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;  // Force refresh.
    });

    this._userService.loggedInUser.pipe(first()).subscribe(user => this.currentUser = user);

    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        }))
        .pipe(first())
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    merge(timer(0, 10 * this._appConfig.getRefreshTimeBase()), this._membersUpdate)
        .pipe(switchMap(() => this._selectedProject ? this._apiService.getMembers(this._selectedProject.id) : EMPTY))
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

  getGroup(member: MemberEntity): string {
    return this._selectedProject ?
        MemberUtils.getGroupDisplayName(MemberUtils.getGroupInProject(member, this._selectedProject.id)) :
        '';
  }

  isAddEnabled(): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, 'members', Permission.Create);
  }

  addMember(): void {
    const modal = this._matDialog.open(AddMemberComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.afterClosed().pipe(first()).subscribe((member: MemberEntity) => {
      if (member) {
        this.members.push(member);
        this._membersUpdate.next();
      }
    });
  }

  isEditEnabled(member: MemberEntity): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, 'members', Permission.Edit) ||
        (this.currentUser && member && this.currentUser.email !== member.email);
  }

  editMember(member: MemberEntity): void {
    const modal = this._matDialog.open(EditMemberComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.member = member;
    modal.afterClosed().pipe(first()).subscribe(isEdited => {
      if (isEdited) {
        this._membersUpdate.next();
      }
    });
  }

  isDeleteEnabled(member: MemberEntity): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, 'members', Permission.Delete) ||
        (this.currentUser && member && this.currentUser.email !== member.email);
  }

  deleteMember(member: MemberEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Member',
        message: `Delete member "<strong>${member.name}</strong>" from project "<strong>${
            this._selectedProject.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef.afterClosed().pipe(first()).subscribe(isConfirmed => {
      if (isConfirmed) {
        this._apiService.deleteMembers(this._selectedProject.id, member).pipe(first()).subscribe(() => {
          this._notificationService.success(
              `Member ${member.name} has been removed from project ${this._selectedProject.name}`);
          this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
        });
      }
    });
  }

  hasItems(): boolean {
    return !_.isEmpty(this.members);
  }

  isPaginatorVisible(): boolean {
    return this.hasItems() && this.paginator && this.members.length > this.paginator.pageSize;
  }
}
