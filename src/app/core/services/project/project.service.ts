import {Injectable} from '@angular/core';
import {Router, RouterStateSnapshot} from '@angular/router';
import {first} from 'rxjs/operators';
import {Subject} from 'rxjs/Subject';

import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {GroupConfig, UserGroupConfig} from '../../../shared/model/Config';
import {ProjectUtils} from '../../../shared/utils/project-utils/project-utils';
import {ApiService} from '../api/api.service';
import {UserService} from '../user/user.service';

@Injectable()
export class ProjectService {
  private static _localStorageProjectKey = 'project';
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  project: ProjectEntity;
  projects: ProjectEntity[];
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  constructor(
      private router: Router, private apiService: ApiService, private userService: UserService,
      private appConfigService: AppConfigService) {}

  deselectProject(): void {
    this.project = undefined;
    this._project.next(undefined);
    localStorage.removeItem(ProjectService._localStorageProjectKey);
  }

  changeSelectedProject(project: ProjectEntity): boolean {
    if (ProjectUtils.isProjectActive(project)) {
      this.project = project;
      this._project.next(this.project);
      return true;
    } else {
      return false;
    }
  }

  storeProject(project: ProjectEntity): void {
    localStorage.setItem(ProjectService._localStorageProjectKey, JSON.stringify(project));
  }

  getProjectFromStorage(): ProjectEntity {
    const project = localStorage.getItem(ProjectService._localStorageProjectKey);
    return project && JSON.parse(project);
  }

  getAndCompareProject(selectedProjectId: string): void {
    this.apiService.getProjects().pipe(first()).subscribe((res) => {
      this.projects = res;
      for (const i in this.projects) {
        if (this.projects[i].id === selectedProjectId) {
          this.changeAndStoreSelectedProject(this.projects[i], false);
          break;
        }
      }
    });
  }

  getCurrentProjectId(): string|undefined {
    const urlArray = this.router.routerState.snapshot.url.split('/');
    if (!!this.project) {
      return this.project.id;
    } else if (urlArray.length > 2) {
      this.getAndCompareProject(urlArray[2]);  // Assuming that the project ID is at index 2.
      return urlArray[2];
    } else {
      return undefined;
    }
  }

  getUserGroupConfig(userGroup: string = this.userGroup): GroupConfig {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    return !!this.userGroupConfig ? this.userGroupConfig[userGroup] : undefined;
  }

  async changeAndStoreSelectedProject(project: ProjectEntity, changeView = true): Promise<any> {
    this.changeSelectedProject(project);
    this.storeProject(project);
    if (this.project.id !== '') {
      this.userGroup = await this.userService.currentUserGroup(this.project.id).toPromise();
      if (changeView) {
        this.changeViewOnProjectChange();
      }
    } else {
      this.userGroup = null;
      this.navigateToProjectPage();
    }
  }

  navigateToProjectPage(): void {
    this.router.navigate(['/projects']);
  }

  navigateToClusterPage(): void {
    this.router.navigate(['/projects/' + this.project.id + '/clusters']);
  }

  navigateToClusterDetailPage(url: string): void {
    this.router.navigate([url]);
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

  navigateToServiceAccountPage(): void {
    this.router.navigate(['/projects/' + this.project.id + '/serviceaccounts']);
  }

  changeViewOnProjectChange(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    const snapshot: RouterStateSnapshot = this.router.routerState.snapshot;
    const urlArray = snapshot.url.split('/');
    setTimeout(() => {
      if (this.isCurrentProjectActive()) {
        if ((snapshot.url.search(/(\/wizard)/) > -1) && !!this.userGroupConfig[this.userGroup].clusters.create) {
          this.navigateToWizard();
        } else if ((snapshot.url.search(/(\/clusters)/) > -1) && !!this.userGroupConfig[this.userGroup].clusters.view) {
          this.navigateToClusterPage();
        } else if ((snapshot.url.search(/(\/members)/) > -1) && !!this.userGroupConfig[this.userGroup].members.view) {
          this.navigateToMemberPage();
        } else if ((snapshot.url.search(/(\/sshkeys)/) > -1) && !!this.userGroupConfig[this.userGroup].sshKeys.view) {
          this.navigateToSshKeyPage();
        } else if (
            (snapshot.url.search(/(\/serviceaccounts)/) > -1) &&
            !!this.userGroupConfig[this.userGroup].serviceaccounts.view) {
          this.navigateToServiceAccountPage();
        } else if (!!urlArray.find((x) => x === this.project.id) && !!urlArray.find((x) => x === 'dc')) {
          this.navigateToClusterDetailPage(snapshot.url);
        } else {
          this.navigateToProjectPage();
        }
      } else {
        this.navigateToProjectPage();
      }
    }, 500);
  }

  isCurrentProjectActive(): boolean {
    return ProjectUtils.isProjectActive(this.project);
  }

  isViewEnabled(viewName: string): boolean {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    if (!!this.project && this.project.status === 'Active' && !!this.userGroupConfig && this.userGroup) {
      return this.userGroupConfig[this.userGroup][viewName].view;
    } else {
      return false;
    }
  }

  getMenuItemClass(viewName: string): string {
    return this.isViewEnabled(viewName) ? '' : 'km-disabled';
  }

  compareProjectsEquality(a: ProjectEntity, b: ProjectEntity): boolean {
    return !!a && !!b && a.id === b.id;
  }
}
