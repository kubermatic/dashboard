import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {interval, Subscription} from 'rxjs';
import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity, MemberProject} from '../shared/entity/MemberEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../shared/model/Config';
import {AddMemberComponent} from './add-member/add-member.component';
import {EditMemberComponent} from './edit-member/edit-member.component';

@Component({
  selector: 'kubermatic-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss'],
})

export class MemberComponent implements OnInit, OnDestroy {
  project: ProjectEntity;
  members: MemberEntity[] = [];
  loading = true;
  sortedMembers: MemberEntity[] = [];
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  displayedColumns: string[] = ['name', 'email', 'group', 'actions'];
  dataSource = new MatTableDataSource<MemberEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private projectService: ProjectService, public dialog: MatDialog,
      private userService: UserService, private appConfigService: AppConfigService,
      private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
      this.userGroupConfig = this.appConfigService.getUserGroupConfig();
      this.userService.currentUserGroup(this.project.id).subscribe((group) => {
        this.userGroup = group;
      });
    }));

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    const timer = interval(5000);
    this.subscriptions.push(timer.subscribe(() => {
      this.refreshMembers();
    }));
    this.refreshMembers();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getDataSource(): MatTableDataSource<MemberEntity> {
    this.dataSource.data = this.members;
    return this.dataSource;
  }

  addMember(): void {
    const modal = this.dialog.open(AddMemberComponent);
    modal.componentInstance.project = this.project;

    const sub = modal.afterClosed().subscribe((added) => {
      if (added) {
        this.refreshMembers();
      }
      sub.unsubscribe();
    });
  }

  refreshMembers(): void {
    if (this.project) {
      this.subscriptions.push(this.api.getMembers(this.project.id).subscribe((res) => {
        this.members = res;
        this.loading = false;
      }));
    }
  }

  compare(a, b, isAsc): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getGroup(memberProjects: MemberProject[]): string {
    for (const i of Object.keys(memberProjects)) {
      if (memberProjects[i].id === this.project.id) {
        const group = memberProjects[i].group.split('-')[0];
        switch (group) {
          case 'owners':
            return 'Owner';
          case 'editors':
            return 'Editor';
          case 'viewers':
            return 'Viewer';
          default:
            return '';
        }
      }
      return '';
    }
  }

  editMember(member: MemberEntity): void {
    const modal = this.dialog.open(EditMemberComponent);
    modal.componentInstance.project = this.project;
    modal.componentInstance.member = member;
    const sub = modal.afterClosed().subscribe((edited) => {
      sub.unsubscribe();
    });
  }

  deleteMember(member: MemberEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Remove member from project',
        message: `You are on the way to remove the member ${member.name} from the project ${
            this.project.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteMembers(this.project.id, member).subscribe(() => {
          NotificationActions.success(
              'Success', `Member ${member.name} has been removed from project ${this.project.name}`);
          this.googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
        });
      }
    });
  }
}
