import {ProjectsPage} from '../pages/projects/projects.po';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';

import {KMElement} from './element';

export class ProjectUtils {
  private static _projectsPage = new ProjectsPage();
  private static _confirmationDialog = new ConfirmationDialog();

  static createProject(projectName: string): void {
    ProjectUtils._projectsPage.navigateTo();
    KMElement.waitToAppear(ProjectUtils._projectsPage.getAddProjectButton());

    ProjectUtils._projectsPage.getAddProjectButton().click();
    expect(ProjectUtils._projectsPage.getAddProjectDialog().isPresent()).toBeTruthy();

    ProjectUtils._projectsPage.getProjectNameInput().sendKeys(projectName);
    ProjectUtils._projectsPage.getSaveProjectButton().click();

    KMElement.waitToDisappear(ProjectUtils._projectsPage.getAddProjectDialog());

    KMElement.waitToAppear(ProjectUtils._projectsPage.getProjectItem(projectName));
    KMElement.waitToAppear(ProjectUtils._projectsPage.getActiveProjectItem(projectName), 300000);

    expect(ProjectUtils._projectsPage.getProjectItem(projectName).isPresent()).toBeTruthy();
  }

  static deleteProject(projectName: string): void {
    ProjectUtils._projectsPage.navigateTo();
    KMElement.waitForRedirect('/projects');

    KMElement.waitToAppear(ProjectUtils._projectsPage.getDeleteProjectButton(projectName));
    ProjectUtils._projectsPage.getDeleteProjectButton(projectName).click();
    expect(ProjectUtils._confirmationDialog.getConfirmationDialog().isPresent()).toBeTruthy();

    KMElement.sendKeys(ProjectUtils._confirmationDialog.getConfirmationDialogInput(), projectName);
    ProjectUtils._confirmationDialog.getConfirmationDialogConfirmBtn().click();

    KMElement.waitToDisappear(ProjectUtils._projectsPage.getProjectItem(projectName));
    expect(ProjectUtils._projectsPage.getProjectItem(projectName).isPresent()).toBeFalsy();
  }
}
