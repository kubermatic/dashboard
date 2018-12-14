import {by, element} from 'protractor';

import {BasePage} from '../shared/base.po';

export class ProjectsPage extends BasePage {
  private _logoutButton = by.xpath('//div[contains(@class, \'auth\')]/span[2]');
  private _addProjectButton = by.xpath('//kubermatic-project/div/div/div/button');
  private _addProjectDialog = by.xpath('//mat-dialog-container/kubermatic-add-project');
  private _projectNameInput = by.xpath('//mat-dialog-container/kubermatic-add-project//mat-form-field//input');
  private _saveProjectButton = by.xpath('//mat-dialog-container/kubermatic-add-project//mat-dialog-actions/button[2]');
  private _deleteProjectDialog = by.xpath('//mat-dialog-container/kubermatic-project-delete-confirmation');
  private _deleteProjectDialogInput = by.xpath('//mat-dialog-container/kubermatic-project-delete-confirmation//input');
  private _deleteProjectDialogButton = by.xpath('//mat-dialog-actions//button[2]');
  private _projectsNavButton = by.xpath('//mat-nav-list//mat-list-item[6]//a');

  navigateTo(): any {
    return element(this._projectsNavButton).click();
  }

  getLogoutButton(): any {
    return element(this._logoutButton);
  }

  getAddProjectButton(): any {
    return element(this._addProjectButton);
  }

  getAddProjectDialog(): any {
    return element(this._addProjectDialog);
  }

  getProjectNameInput(): any {
    return element(this._projectNameInput);
  }

  getSaveProjectButton(): any {
    return element(this._saveProjectButton);
  }

  getProjectItem(projectName: string): any {
    return element(by.xpath(`//kubermatic-project-item//*[text()='${projectName}']`));
  }

  getDeleteProjectButton(projectName: string): any {
    return element(by.xpath(`//kubermatic-project-item//*[text()='${projectName}']/parent::div/parent::div/div[3]//button`));
  }

  getDeleteProjectDialog(): any {
    return element(this._deleteProjectDialog);
  }

  getDeleteProjectDialogInput(): any {
    return element(this._deleteProjectDialogInput);
  }

  getDeleteProjectDialogButton(): any {
    return element(this._deleteProjectDialogButton);
  }
}
