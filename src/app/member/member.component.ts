import { Component, OnInit, OnDestroy } from '@angular/core';
import { Sort, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/interval';
import { NotificationActions } from '../redux/actions/notification.actions';
import { ApiService, ProjectService, UserService } from '../core/services';
import { AppConfigService } from '../app-config.service';
import { AddMemberComponent } from './add-member/add-member.component';
import { MemberEntity } from '../shared/entity/MemberEntity';
import { ProjectEntity } from '../shared/entity/ProjectEntity';
import { UserGroupConfig } from '../shared/model/Config';

@Component({
  selector: 'kubermatic-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss']
})

export class MemberComponent implements OnInit, OnDestroy {
  public project: ProjectEntity;
  public members: MemberEntity[] = [];
  public loading = true;
  public sortedMembers: MemberEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router,
              private api: ApiService,
              private projectService: ProjectService,
              public dialog: MatDialog,
              private userService: UserService,
              private appConfigService: AppConfigService) { }

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
      this.userGroupConfig = this.appConfigService.getUserGroupConfig();
      this.userService.currentUserGroup(this.project.id).subscribe(group => {
        this.userGroup = group;
      });
    }));

    const timer = Observable.interval(5000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshMembers();
    }));
    this.refreshMembers();
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public addMember() {
    const modal = this.dialog.open(AddMemberComponent);
    modal.componentInstance.project = this.project;

    const sub = modal.afterClosed().subscribe(added => {
      if (added) {
        this.refreshMembers();
      }
      sub.unsubscribe();
    });
  }

  refreshMembers() {
    if (this.project) {
      this.subscriptions.push(this.api.getMembers(this.project.id).subscribe(res => {
        this.members = res;
        this.sortData(this.sort);
        this.loading = false;
      }));
    }
  }

  sortData(sort: Sort) {
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

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getGroup(projectsA, projectsB, isAsc) {
    let groupA: string;
    let groupB: string;

    for (const i of Object.keys(projectsA)) {
      if (projectsA[i].id === this.project.id) {
        const group = projectsA[i].group.replace(/(\-[\w\d]+)$/, '');
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
        const group = projectsB[i].group.replace(/(\-[\w\d]+)$/, '');
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
