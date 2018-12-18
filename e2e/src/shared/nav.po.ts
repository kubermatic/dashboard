import {by, element} from 'protractor';

export class NavPage {
  private _logoutButton = by.id('km-navbar-logout-btn');
  private _createClusterNavButton = by.id('km-nav-item-create-cluster');
  private _clustersNavButton = by.id('km-nav-item-clusters');
  private _membersNavButton = by.id('km-nav-item-members');
  private _projectsNavButton = by.id('km-nav-item-projects');

  getLogoutButton(): any {
    return element(this._logoutButton);
  }

  getCreateClusterNavButton(): any {
    return element(this._createClusterNavButton);
  }

  getClustersNavButton(): any {
    return element(this._clustersNavButton);
  }

  getMembersNavButton(): any {
    return element(this._membersNavButton);
  }

  getProjectsNavButton(): any {
    return element(this._projectsNavButton);
  }
}
