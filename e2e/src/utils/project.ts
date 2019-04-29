import {ProjectsPage} from '../pages/projects/projects.po';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';

import {KMElement} from './element';
import {NavPage} from '../pages/shared/nav.po';
import {browser} from 'protractor';

export class ProjectUtils {
  private static _navPage = new NavPage();
  private static _projectsPage = new ProjectsPage();
  private static _confirmationDialog = new ConfirmationDialog();

  static async goBackToProjects() {
    await KMElement.click(ProjectUtils._navPage.getProjectsNavButton());

    await KMElement.waitForRedirect('/projects');
  }

  static async selectProject(projectName: string) {
    // Project should be active before we select it.
    await KMElement.waitToAppear(ProjectUtils._projectsPage.getActiveProjectItem(projectName));
    expect(await ProjectUtils._projectsPage.getActiveProjectItem(projectName).isDisplayed()).toBeTruthy();

    await KMElement.click(ProjectUtils._projectsPage.getProjectItem(projectName));

    await KMElement.waitForRedirect('/clusters');

    // Wait until side menu will be available.
    await KMElement.waitForClickable(ProjectUtils._navPage.getProjectsNavButton());
    expect(await ProjectUtils._navPage.getProjectsNavButton().isDisplayed()).toBeTruthy();
  }

  static async createProject(projectName: string) {
    await KMElement.click(ProjectUtils._projectsPage.getAddProjectButton());
    expect(await ProjectUtils._projectsPage.getAddProjectDialog().isDisplayed()).toBeTruthy();

    await ProjectUtils._projectsPage.getProjectNameInput().sendKeys(projectName);
    await KMElement.click(ProjectUtils._projectsPage.getSaveProjectButton());

    await KMElement.waitToDisappear(ProjectUtils._projectsPage.getAddProjectDialog());
  }

  static async deleteProject(projectName: string) {
    await KMElement.click(ProjectUtils._projectsPage.getDeleteProjectButton(projectName));
    expect(await ProjectUtils._confirmationDialog.getConfirmationDialog().isDisplayed()).toBeTruthy();

    await KMElement.fill(ProjectUtils._confirmationDialog.getConfirmationDialogInput(), projectName);
    await KMElement.click(ProjectUtils._confirmationDialog.getConfirmationDialogConfirmBtn());

    await KMElement.waitToDisappear(ProjectUtils._projectsPage.getProjectItem(projectName));
    expect(await browser.isElementPresent(ProjectUtils._projectsPage.getProjectItem(projectName))).toBeFalsy();
  }
}
