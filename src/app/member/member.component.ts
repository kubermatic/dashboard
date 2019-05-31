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
  private _externalMembersUpdate: Subject<any> = new Subject();

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _matDialog: MatDialog, private readonly _userService: UserService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _appConfig: AppConfigService) {
  }

  ngOnInit(): void {
    this._userService.getUser().pipe(first()).subscribe((user) => {
      this.currentUser = user;
    });

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    merge(timer(0, 5 * this._appConfig.getRefreshTimeBase()), this._externalMembersUpdate)
        .pipe(switchMap(
            () => this._projectService.project ?
                this._apiService.getMembers(this._projectService.getCurrentProjectId()) :
                EMPTY))
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
    return this._projectService.project ? MemberUtils.getGroupDisplayName(MemberUtils.getGroupInProject(
                                              member, this._projectService.getCurrentProjectId())) :
                                          '';
  }

  isAddEnabled(): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().members.invite;
  }

  addMember(): void {
    const modal = this._matDialog.open(AddMemberComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.afterClosed().pipe(first()).subscribe((member: MemberEntity) => {
      if (member) {
        this.members.push(member);
        this._externalMembersUpdate.next();
      }
    });
  }

  isEditEnabled(member: MemberEntity): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().members.edit ||
        (this.currentUser && member && this.currentUser.email !== member.email);
  }

  editMember(member: MemberEntity): void {
    const modal = this._matDialog.open(EditMemberComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.componentInstance.member = member;
    modal.afterClosed().pipe(first()).subscribe(isEdited => {
      if (isEdited) {
        this._externalMembersUpdate.next();
      }
    });
  }

  isDeleteEnabled(member: MemberEntity): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().members.remove ||
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
        this._apiService.deleteMembers(this._projectService.getCurrentProjectId(), member)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(
                  'Success',
                  `Member ${member.name} has been removed from project ${this._projectService.project.name}`);
              this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
            });
      }
    });
  }
}
