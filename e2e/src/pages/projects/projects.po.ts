import {by, element} from 'protractor';

import {NavPage} from '../shared/nav.po';

export class ProjectsPage extends NavPage {
  getAddProjectButton(): any {
    return element(by.id('km-add-project-top-btn'));
  }

  getAddProjectDialog(): any {
    return element(by.id('km-add-project-dialog'));
  }

  getProjectNameInput(): any {
    return element(by.id('km-add-project-dialog-input'));
  }

  getSaveProjectButton(): any {
    return element(by.id('km-add-project-dialog-save'));
  }

  getProjectItem(projectName: string): any {
    return element(by.id(`km-project-name-${projectName}`));
  }

  getActiveProjectItem(projectName: string): any {
    return element(by.xpath(`//*[@id="km-project-name-${projectName}"]/../td/i[contains(@class, "km-health-state fa fa-circle green")]`));
  }

  getDeleteProjectButton(projectName: string): any {
    return element(by.id(`km-delete-project-${projectName}`));
  }

  getProjectEditBtn(projectName: string): any {
    return element(by.id(`km-edit-project-${projectName}`));
  }

  getEditProjectDialogEditBtn(): any {
    return element(by.id('km-edit-project-dialog-edit-btn'));
  }

  getEditProjectDialogInput(): any {
    return element(by.id('km-edit-project-dialog-input'));
  }

  getEditProjectDialog(): any {
    return element(by.id('km-edit-project-dialog'));
  }
}
