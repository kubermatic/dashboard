import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ProjectService } from '../../core/services';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { MemberEntity, MemberProject } from '../../shared/entity/MemberEntity';

@Component({
  selector: 'kubermatic-member-item',
  templateUrl: './member-item.component.html',
  styleUrls: ['./member-item.component.scss'],
})
export class MemberItemComponent implements OnInit {
  @Input() index: number;
  @Input() project: ProjectEntity;
  @Input() member: MemberEntity;

  constructor(private projectService: ProjectService) {}

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
}
