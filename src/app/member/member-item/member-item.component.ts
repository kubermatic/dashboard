import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AppConfigService} from '../../app-config.service';
import {UserService} from '../../core/services';
import {MemberEntity, MemberProject} from '../../shared/entity/MemberEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../../shared/model/Config';
import {EditMemberComponent} from '../edit-member/edit-member.component';
import {MemberDeleteConfirmationComponent} from '../member-delete-confirmation/member-delete-confirmation.component';

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

  constructor(private dialog: MatDialog, private appConfigService: AppConfigService, private userService: UserService) {
  }

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
    const modal = this.dialog.open(MemberDeleteConfirmationComponent);
    modal.componentInstance.project = this.project;
    modal.componentInstance.member = this.member;
    const sub = modal.afterClosed().subscribe((deleted) => {
      sub.unsubscribe();
    });
  }
}
