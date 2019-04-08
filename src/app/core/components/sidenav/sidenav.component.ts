import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatSelectChange} from '@angular/material';
import {Router, RouterState, RouterStateSnapshot} from '@angular/router';
import {Subscription, timer} from 'rxjs';
import {first} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AddProjectDialogComponent} from '../../../shared/components/add-project-dialog/add-project-dialog.component';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {ApiService, ProjectService} from '../../services';

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})

export class SidenavComponent implements OnInit, OnDestroy {
  environment: any = environment;
  projects: ProjectEntity[];
  selectedProject: ProjectEntity;
  private subscriptions: Subscription[] = [];
  private readonly notActiveProjectRefreshInterval = 1500;

  constructor(
      public dialog: MatDialog, private api: ApiService, private router: Router,
      public projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((data) => {
      for (const i in this.projects) {
        if (this.projectService.compareProjectsEquality(this.projects[i], data)) {
          this.selectedProject = data;
          if (this.projects[i].name !== data.name) {
            this.loadProjects();
          }
          return;
        }
      }
      this.loadProjects();
      this.selectedProject = data;
    }));

    this.registerProjectRefreshInterval();
  }

  private changeSelectedProject(project: ProjectEntity): void {
    this.projectService.changeAndStoreSelectedProject(project);
    this.selectedProject = project;
  }

  private registerProjectRefreshInterval(): void {
    this.subscriptions.push(timer(this.notActiveProjectRefreshInterval).subscribe(() => {
      if (!!this.selectedProject && this.selectedProject.status !== 'Active') {
        this.api.getProjects().pipe(first()).subscribe((res) => {
          this.projects = res;
          for (const i in this.projects) {
            if (this.projectService.compareProjectsEquality(this.projects[i], this.selectedProject)) {
              this.changeSelectedProject(this.projects[i]);
            }
          }
        });
      }
    }));
  }

  loadProjects(): void {
    this.api.getProjects().subscribe((res) => {
      this.projects = res;

      if (this.projects.length === 1) {
        this.changeSelectedProject(this.projects[0]);
        return;
      }

      const projectFromStorage = this.projectService.getProjectFromStorage();
      if (!!projectFromStorage) {
        for (const i in this.projects) {
          if (this.projectService.compareProjectsEquality(this.projects[i], projectFromStorage)) {
            this.changeSelectedProject(this.projects[i]);
          }
        }
      }
    });
  }

  selectionChange(event: MatSelectChange, previous: ProjectEntity, select: any): void {
    if (event.value === undefined) {
      // The only option with undefined value is "+ Add Project". If it gets
      // selected, we revert both the model and the control to the old value.
      this.selectedProject = previous;
      select.value = previous;
    } else {
      for (const i in this.projects) {
        if (this.projectService.compareProjectsEquality(this.projects[i], event.value)) {
          this.changeSelectedProject(this.projects[i]);
        }
      }
    }
  }

  addProject(): void {
    const modal = this.dialog.open(AddProjectDialogComponent);
    const sub = modal.afterClosed().subscribe((added) => {
      if (added) {
        this.loadProjects();
      }
      sub.unsubscribe();
    });
  }

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  getIconClass(url: string): string {
    return this.checkUrl(url) ? 'white' : 'black';
  }

  checkUrl(url: string): boolean {
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;

    if (url === 'projects') {
      return (snapshot.url === '/' + url);
    } else {
      const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
      const urlArray = snapshot.url.split('/');
      return !!urlArray.find((x) => x === selectedProjectId) && !!urlArray.find((x) => x === url);
    }
  }

  getRouterLink(target: string): string {
    const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
    return `/projects/${selectedProjectId}/${target}`;
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
