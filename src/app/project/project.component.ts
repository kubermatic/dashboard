import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort, MatDialog, MatTabChangeEvent } from '@angular/material';
import { Observable, ObservableInput } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { find } from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { AppConfigService } from '../app-config.service';
import { ApiService, ProjectService, UserService } from '../core/services';
import { NotificationActions } from '../redux/actions/notification.actions';
import { Router } from '@angular/router';
import { ProjectEntity } from '../shared/entity/ProjectEntity';
import { AddProjectComponent } from '../add-project/add-project.component';
import { AddMemberComponent } from '../member/add-member/add-member.component';
import { UserGroupConfig } from '../shared/model/Config';
import { AddSshKeyModalComponent } from '../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { SSHKeyEntity } from '../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})

export class ProjectComponent implements OnInit, OnDestroy {
  public projects: ProjectEntity[];
  public currentProject: ProjectEntity;
  public loading = true;
  public loadingProjects = true;  public sortedProjects: ProjectEntity[] = [];
  public sortedSshKeys: SSHKeyEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public selectedTab = 'projects';
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router,
              private api: ApiService,
              private appConfigService: AppConfigService,
              private projectService: ProjectService,
              private userService: UserService,
              public dialog: MatDialog) { }

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();

    this.currentProject = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.currentProject = project;
      this.userService.currentUserGroup(this.currentProject.id).subscribe(group => {
        this.userGroup = group;
      });
    }));

    const timer = Observable.interval(10000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshProjects();
      this.refreshSSHKeys();
    }));
    this.refreshProjects();

  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshProjects() {
    this.subscriptions.push(this.api.getProjects().subscribe(res => {
      this.projects = res;
      this.sortProjectData(this.sort);
      this.loadingProjects = false;
    }));
  }

  refreshSSHKeys() {
    this.subscriptions.push(this.api.getSSHKeys(this.project.id).retry(3).subscribe(res => {
      this.sshKeys = res;
      this.sortSshKeyData(this.sort);
      this.loadingSshKeys = false;
    }));
  }

  public addProject() {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe(added => {
      if (added) {
        this.refreshProjects();
      }
      sub.unsubscribe();
    });
  }

  public addMember() {
    const modal = this.dialog.open(AddMemberComponent);
    modal.componentInstance.project = this.currentProject;

    const sub = modal.afterClosed().subscribe(added => {
      sub.unsubscribe();
    });
  }

  public addSshKey(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent);

    dialogRef.afterClosed().subscribe(result => {
      result && this.refreshSSHKeys();
    });
  }
  public trackProject(index: number, project: ProjectEntity): number {
    const prevProject = find(this.projects, item => {
      return item.name === project.name;
    });

    return prevProject && prevProject.status === project.status ? index : undefined;
  }

  public trackSshKey(index: number, shhKey: SSHKeyEntity): number {
    const prevSSHKey = find(this.sshKeys, item => {
      return item.spec.name === shhKey.spec.name;
    });

    return prevSSHKey === shhKey ? index : undefined;
  }

  sortProjectData(sort: Sort) {
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedProjects = this.projects;
      return;
    }

    this.sort = sort;

    this.sortedProjects = this.projects.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'status':
          return this.compare(a.status, b.status, isAsc);
        default:
          return 0;
      }
    });
  }
  sortSshKeyData(sort: Sort) {
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedSshKeys = this.sshKeys;
      return;
    }

    this.sort = sort;

    this.sortedSshKeys = this.sshKeys.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.spec.name, b.spec.name, isAsc);
        case 'status':
          return this.compare(a.spec.fingerprint, b.spec.fingerprint, isAsc);
        default:
          return 0;
      }
    });
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  public changeView(event: MatTabChangeEvent) {
    switch (event.tab.textLabel) {
      case 'Projects':
        return this.selectedTab = 'projects';
      case 'Members':
        return this.selectedTab = 'members';
      case 'SSHkeys':
        return this.selectedTab = 'sshkeys';
      default:
        return this.selectedTab = 'projects';
    }
  }
}
