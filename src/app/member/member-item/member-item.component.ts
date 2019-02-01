import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {AppConfigService} from '../../app-config.service';
import {ApiService, UserService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity, MemberProject} from '../../shared/entity/MemberEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../../shared/model/Config';
import {EditMemberComponent} from '../edit-member/edit-member.component';

@Component({
  selector: 'kubermatic-member-item',
  templateUrl: './member-item.component.html',
  styleUrls: ['./member-item.component.scss'],
})
export class MemberItemComponent implements OnInit {
  @Input() index: number;
  @Input() project: ProjectEntity;
  @Input() member: MemberEntity;
  userGroupConfig: UserGroupConfig;
  userGroup: string;

  constructor(
      private api: ApiService, private googleAnalyticsService: GoogleAnalyticsService, private dialog: MatDialog,
      private appConfigService: AppConfigService, private userService: UserService) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.project.id).subscribe((group) => {
      this.userGroup = group;
    });
  }

  getMemberItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'km-odd';
    }
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

  editMember(): void {
    const modal = this.dialog.open(EditMemberComponent);
    modal.componentInstance.project = this.project;
    modal.componentInstance.member = this.member;
    const sub = modal.afterClosed().subscribe((edited) => {
      sub.unsubscribe();
    });
  }

  deleteMember(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        dialogId: 'km-delete-member-dialog',
        title: 'Remove member from project',
        message: `You are on the way to remove the member ${this.member.name} from the project ${
            this.project.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        confirmLabelId: 'km-delete-member-dialog-btn',
        cancelLabel: 'Close',
        cancelLabelId: 'km-close-member-dialog-btn',
        verifyName: false,
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteMembers(this.project.id, this.member).subscribe(() => {
          NotificationActions.success('Success', 'Member has been removed from project');
          this.googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
        });
      }
    });
  }
}
