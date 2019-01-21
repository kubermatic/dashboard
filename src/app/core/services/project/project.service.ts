import {Injectable} from '@angular/core';
import {Router, RouterState, RouterStateSnapshot} from '@angular/router';
import {Subject} from 'rxjs/Subject';
import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
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

  changeAndStoreSelectedProject(project: ProjectEntity): void {
    this.changeSelectedProject(project);
    this.storeProject(project);
    if (this.project.id !== '') {
      this.userService.currentUserGroup(this.project.id).subscribe((group) => {
        this.userGroup = group;
        this.changeViewOnProjectChange();
      });
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

  changeViewOnProjectChange(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    const router: Router = this.router;
    setTimeout(() => {
      const state: RouterState = router.routerState;
      const snapshot: RouterStateSnapshot = state.snapshot;
      const urlArray = snapshot.url.split('/');

      if (!!this.project && this.project.status === 'Active') {
        if ((snapshot.url.search(/(\/wizard)/) > -1) && !!this.userGroupConfig[this.userGroup].clusters.create) {
          this.navigateToWizard();
        } else if ((snapshot.url.search(/(\/members)/) > -1) && !!this.userGroupConfig[this.userGroup].members.view) {
          this.navigateToMemberPage();
        } else if ((snapshot.url.search(/(\/sshkeys)/) > -1) && !!this.userGroupConfig[this.userGroup].sshKeys.view) {
          this.navigateToSshKeyPage();
        } else if (!!urlArray.find((x) => x === this.project.id) && !!urlArray.find((x) => x === 'dc')) {
          this.navigateToClusterDetailPage(snapshot.url);
        } else if (snapshot.url === '/projects)') {
          this.navigateToProjectPage();
        } else {
          this.navigateToClusterPage();
        }
      } else {
        this.navigateToProjectPage();
      }
    }, 500);
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
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
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
    return !!a && !!b && a.id === b.id && a.name === b.name;
  }
}
