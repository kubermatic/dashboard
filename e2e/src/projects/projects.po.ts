import {by, element} from 'protractor';

import {BasePage} from '../shared/base.po';

export class ProjectsPage extends BasePage {
  private _logoutButton = by.id('km-navbar-logout-btn');
  private _addProjectButton = by.id('km-add-project-top-btn');
  private _addProjectDialog = by.id('km-add-project-dialog');
  private _projectNameInput = by.id('km-add-project-dialog-input');
  private _saveProjectButton = by.id('km-add-project-dialog-save');
  private _deleteProjectDialog = by.id('km-delete-project-dialog');
  private _deleteProjectDialogInput = by.id('km-delete-project-dialog-input');
  private _deleteProjectDialogButton = by.id('km-delete-project-dialog-btn');
  private _projectsNavButton = by.id('km-nav-item-projects');

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
    return element(by.id(`km-project-name-${projectName}`));
  }

  getDeleteProjectButton(projectName: string): any {
    return element(by.id(`km-delete-project-${projectName}`));
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
