import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ProjectService } from '../../core/services';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { MemberEntity, MemberProject } from '../../shared/entity/MemberEntity';
import { EditMemberComponent } from '../edit-member/edit-member.component';

@Component({
  selector: 'kubermatic-member-item',
  templateUrl: './member-item.component.html',
  styleUrls: ['./member-item.component.scss'],
})
export class MemberItemComponent implements OnInit {
  @Input() index: number;
  @Input() project: ProjectEntity;
  @Input() member: MemberEntity;

  constructor(private projectService: ProjectService, private dialog: MatDialog) {}

  public ngOnInit(): void { }

  public getMemberItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'odd';
    }
  }

  public getGroup(memberProjects: MemberProject[]): string {
    for (const i of Object.keys(memberProjects)) {
      if (memberProjects[i].id === this.project.id) {
        return memberProjects[i].group;
      }
      return '';
    }
  }

  public editMember() {
    const modal = this.dialog.open(EditMemberComponent);
    modal.componentInstance.project = this.project;
    modal.componentInstance.member = this.member;
    const sub = modal.afterClosed().subscribe(edited => {
      if (edited) {
        // this.reloadMembers();
      }
      sub.unsubscribe();
    });
  }
}
