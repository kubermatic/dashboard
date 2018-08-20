import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort, MatDialog, MatTabChangeEvent } from '@angular/material';
import { Observable, ObservableInput } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { find } from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from '../core/services';
import { NotificationActions } from '../redux/actions/notification.actions';
import { Router } from '@angular/router';
import { ProjectEntity } from '../shared/entity/ProjectEntity';
import { AddProjectComponent } from '../add-project/add-project.component';

@Component({
  selector: 'kubermatic-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})

export class ProjectComponent implements OnInit, OnDestroy {
  public projects: ProjectEntity[];
  public loading = true;
  public sortedProjects: ProjectEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public selectedTab = 'projects';
  private subscriptions: Subscription[] = [];

  constructor(private router: Router,
              private api: ApiService,
              public dialog: MatDialog) { }

  ngOnInit(): void {
    const timer = Observable.interval(10000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshProjects();
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
      this.sortData(this.sort);
      this.loading = false;
    }));
  }

  public addProject() {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe(added => {
      if (added) {
        this.refreshProjects();
        this.router.navigate(['/clusters']);
      }
      sub.unsubscribe();
    });
  }

  public trackProject(index: number, project: ProjectEntity): number {
    const prevProject = find(this.projects, item => {
      return item.name === project.name;
    });

    return prevProject && prevProject.status === project.status ? index : undefined;
  }

  sortData(sort: Sort) {
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
