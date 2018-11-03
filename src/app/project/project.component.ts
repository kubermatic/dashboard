import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, Sort } from '@angular/material';
import { find } from 'lodash';
import { interval, Subscription } from 'rxjs';
import { AddProjectComponent } from '../add-project/add-project.component';
import { AppConfigService } from '../app-config.service';
import { ApiService, ProjectService, UserService } from '../core/services';
import { ProjectEntity } from '../shared/entity/ProjectEntity';
import { UserGroupConfig } from '../shared/model/Config';

@Component({
  selector: 'kubermatic-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})

export class ProjectComponent implements OnInit, OnDestroy {
  public projects: ProjectEntity[];
  public loading = true;
  public currentProject: ProjectEntity;
  public sortedProjects: ProjectEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private appConfigService: AppConfigService,
              private projectService: ProjectService,
              private userService: UserService,
              public dialog: MatDialog) { }

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();

    this.currentProject = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.currentProject = project;
      this.userService.currentUserGroup(this.currentProject.id).subscribe((group) => {
        this.userGroup = group;
      });
    }));

    const timer = interval(10000);
    this.subscriptions.push(timer.subscribe((tick) => {
      this.refreshProjects();
    }));
    this.refreshProjects();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshProjects(): void {
    this.subscriptions.push(this.api.getProjects().subscribe((res) => {
      this.projects = res;
      this.sortProjectData(this.sort);
      this.loading = false;
    }));
  }

  public addProject(): void {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe((added) => {
      if (added) {
        this.refreshProjects();
      }
      sub.unsubscribe();
    });
  }

  public trackProject(index: number, project: ProjectEntity): number {
    const prevProject = find(this.projects, (item) => {
      return item.name === project.name;
    });

    return prevProject && prevProject.status === project.status ? index : undefined;
  }

  sortProjectData(sort: Sort): void {
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

  compare(a, b, isAsc): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

}
