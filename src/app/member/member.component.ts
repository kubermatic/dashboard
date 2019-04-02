import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {interval, Subscription, timer} from 'rxjs';
import {first} from 'rxjs/operators';

import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity} from '../shared/entity/MemberEntity';
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
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _matDialog: MatDialog, private readonly _userService: UserService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this._userService.getUser().pipe(first()).subscribe((user) => {
      this.currentUser = user;
    });

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._registerMembersReloadInterval(0, 5000);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  private _registerMembersReloadInterval(dueTime: number, period: number): void {
    this.subscriptions.push(timer(dueTime, period).subscribe(() => {
      this._reloadMembers();
    }));
  }

  private _reloadMembers(): void {
    if (this._projectService.project) {
      this._apiService.getMembers(this._projectService.project.id).pipe(first()).subscribe(members => {
        this.members = members;
        this.isInitializing = false;
      });
    }
  }

  getDataSource(): MatTableDataSource<MemberEntity> {
    this.dataSource.data = this.members;
    return this.dataSource;
  }

  getGroup(member: MemberEntity): string {
    if (this._projectService.project) {
      const group = MemberUtils.getGroupInProject(member, this._projectService.project.id);
      return MemberUtils.getGroupDisplayName(group);
    }
    return '';
  }

  isAddEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].members.invite;
  }

  addMember(): void {
    const modal = this._matDialog.open(AddMemberComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.afterClosed().pipe(first()).subscribe(isAdded => {
      if (isAdded) {
        this._reloadMembers();
      }
    });
  }

  isEditEnabled(member: MemberEntity): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].members.edit ||
        (this.currentUser && member && this.currentUser.email !== member.email);
  }

  editMember(member: MemberEntity): void {
    const modal = this._matDialog.open(EditMemberComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.componentInstance.member = member;
    modal.afterClosed().pipe(first()).subscribe(isEdited => {
      if (isEdited) {
        this._reloadMembers();
      }
    });
  }

  isDeleteEnabled(member: MemberEntity): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].members.remove ||
        (this.currentUser && member && this.currentUser.email !== member.email);
  }

  deleteMember(member: MemberEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Remove member from project',
        message: `You are on the way to remove the member ${member.name} from the project ${
            this._projectService.project.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef.afterClosed().pipe(first()).subscribe(isConfirmed => {
      if (isConfirmed) {
        this._apiService.deleteMembers(this._projectService.project.id, member).pipe(first()).subscribe(() => {
          NotificationActions.success(
              'Success', `Member ${member.name} has been removed from project ${this._projectService.project.name}`);
          this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
        });
      }
    });
  }
}
