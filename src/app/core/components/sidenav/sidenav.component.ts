import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService, ProjectService, UserService } from '../../../core/services';
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
  public environment: any = environment;
  public projects: ProjectEntity[];
  public selectedProject: string;
  public disableResource: boolean;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(public dialog: MatDialog,
              private api: ApiService,
              private router: Router,
              private projectService: ProjectService,
              private userService: UserService,
              private appConfigService: AppConfigService) { }

  ngOnInit() {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.getProjects();

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(data => {
      for (const i in this.projects) {
        if (this.projects[i].id === data.id) {
          this.selectedProject = data.id;
          this.userService.currentUserGroup(this.projects[i].id).subscribe(group => {
            this.userGroup = group;
          });
          return;
        }
      }
      this.reloadProjects();
      this.selectedProject = data.id;
    }));
  }

  public isProjectSelected(viewName: string): string {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();

    if (this.selectedProject === undefined) {
      return 'disabled';
    } else {
      if (!!this.userGroupConfig && this.userGroup) {
        if (viewName === 'create-cluster') {
          if (!!this.userGroupConfig && !this.userGroupConfig[this.userGroup].clusters.create) {
            return 'disabled';
          } else {
            return '';
          }
        } else {
          if (!!this.userGroupConfig && !this.userGroupConfig[this.userGroup][viewName].view) {
            return 'disabled';
          } else {
            return '';
          }
        }
      }
    }

  }

  public getProjects() {
    this.api.getProjects().subscribe(res => {
      this.projects = res;
      const projectFromStorage = this.projectService.getProjectFromStorage();
      if (!!projectFromStorage) {
        for (const i in this.projects) {
          if (this.projects[i].id === projectFromStorage) {
            this.projectService.changeSelectedProject(this.projects[i]);
            this.selectedProject = projectFromStorage;
            this.userGroupConfig = this.appConfigService.getUserGroupConfig();
            this.userService.currentUserGroup(this.projects[i].id).subscribe(group => {
              this.userGroup = group;
            });
          }
        }
      }
    });

  }

  public selectionChange(event, previousValue, select) {
    // The only option with undefined value is "Select Project". If it gets
    // selected, we revert both the model and the control to the old value.
    if (event.value === undefined) {
      this.selectedProject = previousValue;
      select.value = previousValue;
    } else {
      for (const i in this.projects) {
        if (this.projects[i].id === event.value) {
          this.projectService.changeSelectedProject(this.projects[i]);
          this.projectService.storeProject(this.projects[i].id);
          this.router.navigate(['/projects/' + this.projects[i].id + '/clusters']);
        }
      }
    }
  }

  public addProject() {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe(added => {
      if (added) {
        this.reloadProjects();
        this.router.navigate(['/projects/' + added.id + '/clusters']);
      }
      sub.unsubscribe();
    });
  }

  public reloadProjects() {
    this.getProjects();
  }

  public setIconColor(url: string): boolean {
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;
    if (url === '/projects') {
      return (snapshot.url === url);
    } else {
      const newUrl = '/projects/' + this.selectedProject + url;
      return (snapshot.url === newUrl);
    }
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
