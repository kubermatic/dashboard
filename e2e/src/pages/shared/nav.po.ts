import {by, element} from 'protractor';

export class NavPage {
  getLogoutButton(): any {
    return element(by.id('km-navbar-logout-btn'));
  }

  getClustersNavButton(): any {
    return element(by.id('km-nav-item-clusters'));
  }

  getMembersNavButton(): any {
    return element(by.id('km-nav-item-members'));
  }

  getProjectsNavButton(): any {
    return element(by.id('km-nav-item-projects'));
  }
}
