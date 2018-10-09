import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { MatDialog, MatSelectChange } from '@angular/material';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService, ProjectService, UserService } from '../../services';
import { AppConfigService } from '../../../app-config.service';
import { UserGroupConfig } from '../../../shared/model/Config';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { AddProjectComponent } from '../../../add-project/add-project.component';

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})

export class SidenavComponent implements OnInit, OnDestroy {
  private static readonly notActiveProjectRefreshInterval = 1500;

  public environment: any = environment;
  public projects: ProjectEntity[];
  public selectedProject: ProjectEntity;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(public dialog: MatDialog,
              private api: ApiService,
              private router: Router,
              private projectService: ProjectService,
              private userService: UserService,
              private appConfigService: AppConfigService) { }

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.loadProjects();

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(data => {
      for (const i in this.projects) {
        if (this.compareProjectsEquality(this.projects[i], data)) {
          this.selectedProject = data;
          this.userService.currentUserGroup(this.projects[i].id).subscribe(group => {
            this.userGroup = group;
          });
          return;
        }
      }
      this.loadProjects();
      this.selectedProject = data;
    }));

    this.registerProjectRefreshInterval();
  }

  private registerProjectRefreshInterval() {
    this.subscriptions.push(interval(SidenavComponent.notActiveProjectRefreshInterval).subscribe(() => {
      if (!!this.selectedProject && this.selectedProject.status !== 'Active') {
        this.api.getProjects().toPromise().then(res => {
          this.projects = res;
          for (const i in this.projects) {
            if (this.compareProjectsEquality(this.projects[i], this.selectedProject)) {
              this.selectedProject = this.projects[i];
            }
          }
        });
      }
    }));
  }

  public isProjectSelected(viewName: string): string {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    if (this.selectedProject === undefined || this.selectedProject.status !== 'Active') {
      return 'disabled';
    } else {
      if (!!this.userGroupConfig && this.userGroup) {
        if (viewName === 'create-cluster') {
          return !this.userGroupConfig[this.userGroup].clusters.create ? 'disabled' : '';
        } else {
          return !this.userGroupConfig[this.userGroup][viewName].view ? 'disabled' : '';
        }
      }
    }
  }

  public loadProjects(): void {
    this.api.getProjects().subscribe(res => {
      this.projects = res;
      const projectFromStorage = this.projectService.getProjectFromStorage();
      if (!!projectFromStorage) {
        for (const i in this.projects) {
          if (this.compareProjectsEquality(this.projects[i], projectFromStorage)) {
            this.projectService.changeSelectedProject(this.projects[i]);
            this.selectedProject = this.projects[i];
            this.userGroupConfig = this.appConfigService.getUserGroupConfig();
            this.userService.currentUserGroup(this.projects[i].id).subscribe(group => {
              this.userGroup = group;
            });
          }
        }
      }
    });

  }

  public selectionChange(event: MatSelectChange, previousValue: ProjectEntity, select): void {
    const eventValue: ProjectEntity = event.value;

    // The only option with undefined value is "Select Project". If it gets
    // selected, we revert both the model and the control to the old value.
    if (eventValue === undefined) {
      this.selectedProject = previousValue;
      select.value = previousValue;
    } else {
      for (const i in this.projects) {
        if (this.compareProjectsEquality(this.projects[i], eventValue)) {
          this.projectService.changeSelectedProject(this.projects[i]);
          this.projectService.storeProject(this.projects[i]);
          this.router.navigate(['/projects/' + this.projects[i].id + '/clusters']);
        }
      }
    }
  }

  public addProject(): void {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe(added => {
      if (added) {
        this.loadProjects();
        this.router.navigate(['/projects/' + added.id + '/clusters']);
      }
      sub.unsubscribe();
    });
  }

  public setIconColor(url: string): boolean {
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;
    if (url === '/projects') {
      return (snapshot.url === url);
    } else {
      const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
      const newUrl = '/projects/' + selectedProjectId + url;
      return (snapshot.url === newUrl);
    }
  }

  compareProjectsEquality(a: ProjectEntity, b: ProjectEntity): boolean {
    return !!a && !!b && a.id === b.id;
  }

  getRouterLink(target: string): string {
    const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
    return `/projects/${selectedProjectId}/${target}`;
  }

  public getSelectedProjectStateIconClass(): string {
    let iconClass = '';
    if (!!this.selectedProject) {
      switch (this.selectedProject.status) {
        case 'Active':
          iconClass = 'fa fa-circle green';
          break;
        case 'Inactive':
          iconClass = 'fa fa-spin fa-circle-o-notch orange';
          break;
        case 'Terminating':
          iconClass = 'fa fa-circle-o red';
          break;
      }
    }
    return iconClass;
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
