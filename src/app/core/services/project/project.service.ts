import {Injectable} from '@angular/core';
import {Router, RouterStateSnapshot} from '@angular/router';
import {Subject} from 'rxjs/Subject';

import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {GroupConfig, UserGroupConfig} from '../../../shared/model/Config';
import {ProjectUtils} from '../../../shared/utils/project-utils/project-utils';
import {UserService} from '../user/user.service';

@Injectable()
export class ProjectService {
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  project: ProjectEntity;
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  constructor(private router: Router, private userService: UserService, private appConfigService: AppConfigService) {}

  changeSelectedProject(data: ProjectEntity): void {
    this._project.next(data);
    this.project = data;
  }

  storeProject(project: ProjectEntity): void {
    localStorage.setItem(`project`, JSON.stringify(project));
  }

  removeProject(): void {
    localStorage.removeItem('project');
  }

  getProjectFromStorage(): ProjectEntity {
    const project = localStorage.getItem('project');
    return project && JSON.parse(project);
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
