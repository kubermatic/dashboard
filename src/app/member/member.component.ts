import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, Sort} from '@angular/material';
import {interval, Subscription} from 'rxjs';
import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {MemberEntity} from '../shared/entity/MemberEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../shared/model/Config';
import {AddMemberComponent} from './add-member/add-member.component';

@Component({
  selector: 'kubermatic-member',
  templateUrl: './member.component.html',
})

export class MemberComponent implements OnInit, OnDestroy {
  project: ProjectEntity;
  members: MemberEntity[] = [];
  loading = true;
  sortedMembers: MemberEntity[] = [];
  sort: Sort = {active: 'name', direction: 'asc'};
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private projectService: ProjectService, public dialog: MatDialog,
      private userService: UserService, private appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
      this.userGroupConfig = this.appConfigService.getUserGroupConfig();
      this.userService.currentUserGroup(this.project.id).subscribe((group) => {
        this.userGroup = group;
      });
    }));

    const timer = interval(5000);
    this.subscriptions.push(timer.subscribe((tick) => {
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
        this.sortData(this.sort);
        this.loading = false;
      }));
    }
  }

  sortData(sort: Sort): void {
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedMembers = this.members;
      return;
    }

    this.sort = sort;

    this.sortedMembers = this.members.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'email':
          return this.compare(a.email, b.email, isAsc);
        case 'group':
          return this.getGroup(a.projects, b.projects, isAsc);
        default:
          return 0;
      }
    });
  }

  compare(a, b, isAsc): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getGroup(projectsA, projectsB, isAsc): number {
    let groupA: string;
    let groupB: string;

    for (const i of Object.keys(projectsA)) {
      if (projectsA[i].id === this.project.id) {
        const group = projectsA[i].group.split('-')[0];
        switch (group) {
          case 'owners':
            groupA = 'Owner';
            break;
          case 'editors':
            groupA = 'Editor';
            break;
          case 'viewers':
            groupA = 'Viewer';
            break;
          default:
            groupA = '';
            break;
        }
      }
      groupA = '';
    }

    for (const i of Object.keys(projectsB)) {
      if (projectsB[i].id === this.project.id) {
        const group = projectsB[i].group.split('-')[0];
        switch (group) {
          case 'owners':
            groupB = 'Owner';
            break;
          case 'editors':
            groupB = 'Editor';
            break;
          case 'viewers':
            groupB = 'Viewer';
            break;
          default:
            groupB = '';
            break;
        }
      }
      groupB = '';
    }

    return this.compare(groupA, groupB, isAsc);
  }
}
