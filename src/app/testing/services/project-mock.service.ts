import {Injectable} from '@angular/core';
import {Router, RouterState, RouterStateSnapshot} from '@angular/router';
import {Subject} from 'rxjs/Subject';

import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {GroupConfig} from '../../shared/model/Config';
import {fakeMember} from '../fake-data/member.fake';
import {fakeProject} from '../fake-data/project.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';

@Injectable()
export class ProjectMockService {
  // Complete project object
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  project = fakeProject();
  userGroup = fakeMember().projects[0].group;
  userGroupConfig = fakeUserGroupConfig();

  constructor(private router: Router) {}

  changeSelectedProject(data: ProjectEntity): void {
    this._project.next(fakeProject());
    this.project = fakeProject();
  }

  storeProject(projectID: ProjectEntity): void {
    localStorage.setItem(`project`, JSON.stringify(fakeProject()));
  }

  removeProject(): void {
    localStorage.removeItem('project');
  }

  getProjectFromStorage(): string {
    const project = localStorage.getItem('project');
    return project && JSON.parse(project);
  }

  getUserGroupConfig(): GroupConfig {
    return fakeUserGroupConfig[this.userGroup];
  }

  changeAndStoreSelectedProject(project: ProjectEntity): void {
    this.changeSelectedProject(project);
    this.storeProject(project);
    this.changeViewOnProjectChange();
  }

  navigateToProjectPage(): void {
    this.router.navigate(['/projects']);
  }

  navigateToClusterPage(): void {
    this.router.navigate(['/projects/' + this.project.id + '/clusters']);
  }

  navigateToWizard(): void {
    this.router.navigate(['/projects/' + this.project.id + '/wizard']);
  }

  navigateToMemberPage(): void {
    this.router.navigate(['/projects/' + this.project.id + '/members']);
  }

  navigateToSshKeyPage(): void {
    this.router.navigate(['/projects/' + this.project.id + '/sshkeys']);
  }

  changeViewOnProjectChange(): void {
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;

    if (!!this.project && this.project.status === 'Active') {
      if ((snapshot.url.search(/(\/wizard)/) > -1) && !!this.userGroupConfig[this.userGroup].clusters.create) {
        this.navigateToWizard();
      } else if ((snapshot.url.search(/(\/members)/) > -1) && !!this.userGroupConfig[this.userGroup].members.view) {
        this.navigateToMemberPage();
      } else if ((snapshot.url.search(/(\/sshkeys)/) > -1) && !!this.userGroupConfig[this.userGroup].sshKeys.view) {
        this.navigateToSshKeyPage();
      } else if (snapshot.url === '/projects)') {
        this.navigateToProjectPage();
      } else {
        this.navigateToClusterPage();
      }
    } else {
      this.navigateToProjectPage();
    }
  }

  getProjectStateIconClass(): string {
    let iconClass = '';
    if (!!this.project) {
      switch (this.project.status) {
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

  isProjectSelected(viewName: string): string {
    if (this.project === undefined || this.project.status !== 'Active') {
      return 'km-disabled';
    } else {
      if (!!this.userGroupConfig && this.userGroup) {
        if (viewName === 'create-cluster') {
          return !this.userGroupConfig[this.userGroup].clusters.create ? 'km-disabled' : '';
        } else {
          return !this.userGroupConfig[this.userGroup][viewName].view ? 'km-disabled' : '';
        }
      } else {
        return 'km-disabled';
      }
    }
  }

  compareProjectsEquality(a: ProjectEntity, b: ProjectEntity): boolean {
    return !!a && !!b && a.id === b.id;
  }
}
