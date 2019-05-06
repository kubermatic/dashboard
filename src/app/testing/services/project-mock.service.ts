import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs/Subject';

import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {GroupConfig} from '../../shared/model/Config';
import {fakeMember} from '../fake-data/member.fake';
import {fakeProject, fakeProjects} from '../fake-data/project.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';

@Injectable()
export class ProjectMockService {
  // Complete project object
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  project = fakeProject();
  projects = fakeProjects();
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

  getAndCompareProject(selectedProjectId: string) {
    this.projects = fakeProjects();
    for (const i in this.projects) {
      if (this.projects[i].id === selectedProjectId) {
        this.changeAndStoreSelectedProject(this.projects[i]);
      }
    }
  }

  getCurrentProjectId() {
    const urlArray = ['dev.kubermatic.io', 'projects', fakeProject().id];

    if (!!this.project) {
      return this.project.id;
    } else {
      this.getAndCompareProject(urlArray[2]);
      return urlArray[2];
    }
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
    this.navigateToProjectPage();
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

  isViewEnabled(viewName: string): boolean {
    if (!this.project || this.project.status !== 'Active') {
      return false;
    } else {
      if (!!this.userGroupConfig && this.userGroup) {
        return this.userGroupConfig[this.userGroup][viewName].view;
      } else {
        return false;
      }
    }
  }

  getMenuItemClass(viewName: string): string {
    return this.isViewEnabled(viewName) ? '' : 'km-disabled';
  }

  compareProjectsEquality(a: ProjectEntity, b: ProjectEntity): boolean {
    return !!a && !!b && a.id === b.id;
  }
}
