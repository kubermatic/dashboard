import {by, element} from 'protractor';

import {BasePage} from '../shared/base.po';

export class ProjectsPage extends BasePage {
  private _logoutButton = by.xpath('//div[contains(@class, \'auth\')]/span[2]');

  getLogoutButton(): any {
    return element(this._logoutButton);
  }
}