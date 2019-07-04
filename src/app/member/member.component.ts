import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../app-config.service';

import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity} from '../shared/entity/MemberEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {GroupConfig} from '../shared/model/Config';
import {MemberUtils} from '../shared/utils/member-utils/member-utils';

import {AddMemberComponent} from './add-member/add-member.component';
import {EditMemberComponent} from './edit-member/edit-member.component';

@Component({
  selector: 'kubermatic-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss'],
})

export class MemberComponent implements OnInit, OnDestroy {
  members: MemberEntity[] = [];
  isInitializing = true;
  currentUser: MemberEntity;
  displayedColumns: string[] = ['name', 'email', 'group', 'actions'];
  dataSource = new MatTableDataSource<MemberEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();
  private _membersUpdate: Subject<any> = new Subject();
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: ProjectEntity;

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _matDialog: MatDialog, private readonly _userService: UserService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _appConfig: AppConfigService) {
  }

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.loggedInUser.pipe(first()).subscribe(user => this.currentUser = user);

    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        }))
        .pipe(first())
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    merge(timer(0, 5 * this._appConfig.getRefreshTimeBase()), this._membersUpdate)
        .pipe(switchMap(() => this._selectedProject ? this._apiService.getMembers(this._selectedProject.id) : EMPTY))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(members => {
          this.members = members;
          this.isInitializing = false;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<MemberEntity> {
    this.dataSource.data = this.members;
    return this.dataSource;
  }

  getGroup(member: MemberEntity): string {
    return this._selectedProject ?
        MemberUtils.getGroupDisplayName(MemberUtils.getGroupInProject(member, this._selectedProject.id)) :
        '';
  }

  isAddEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.members.invite;
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
    return !this._currentGroupConfig || this._currentGroupConfig.members.edit ||
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
    return !this._currentGroupConfig || this._currentGroupConfig.members.remove ||
        (this.currentUser && member && this.currentUser.email !== member.email);
  }

  deleteMember(member: MemberEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Member',
        message: `Are you sure you want to permanently delete member "<strong>${member.name}</strong>"
          from project "<strong>${this._selectedProject.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef.afterClosed().pipe(first()).subscribe(isConfirmed => {
      if (isConfirmed) {
        this._apiService.deleteMembers(this._selectedProject.id, member).pipe(first()).subscribe(() => {
          NotificationActions.success(
              `Member ${member.name} has been removed from project ${this._selectedProject.name}`);
          this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
        });
      }
    });
  }
}
