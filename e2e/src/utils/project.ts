import {ProjectsPage} from '../pages/projects/projects.po';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';

import {KMElement} from './element';
import {browser} from 'protractor';

export class ProjectUtils {
  private static _projectsPage = new ProjectsPage();
  private static _confirmationDialog = new ConfirmationDialog();

  static async createProject(projectName: string) {
    await ProjectUtils._projectsPage.navigateTo();

    await KMElement.click(ProjectUtils._projectsPage.getAddProjectButton());
    expect(await ProjectUtils._projectsPage.getAddProjectDialog().isPresent()).toBeTruthy();

    await ProjectUtils._projectsPage.getProjectNameInput().sendKeys(projectName);
    await KMElement.click(ProjectUtils._projectsPage.getSaveProjectButton());

    await KMElement.waitToDisappear(ProjectUtils._projectsPage.getAddProjectDialog());

    await KMElement.waitForRedirect('/clusters');

    // We need to wait for autoredirect after create to finish
    // otherwise it will autoredirect again after too fast page switch.
    await browser.sleep(5000);

    await ProjectUtils._projectsPage.navigateTo();

    await KMElement.waitForRedirect('/projects');

    await KMElement.waitToAppear(ProjectUtils._projectsPage.getProjectItem(projectName));
    expect(await ProjectUtils._projectsPage.getProjectItem(projectName).isPresent()).toBeTruthy();

    await KMElement.waitToAppear(ProjectUtils._projectsPage.getActiveProjectItem(projectName), 300000);
    expect(await ProjectUtils._projectsPage.getActiveProjectItem(projectName).isPresent()).toBeTruthy();
  }

  static async deleteProject(projectName: string) {
    await ProjectUtils._projectsPage.navigateTo();

    await KMElement.waitForRedirect('/projects');

    await KMElement.click(ProjectUtils._projectsPage.getDeleteProjectButton(projectName));
    expect(await ProjectUtils._confirmationDialog.getConfirmationDialog().isPresent()).toBeTruthy();

    await KMElement.fill(ProjectUtils._confirmationDialog.getConfirmationDialogInput(), projectName);
    await KMElement.click(ProjectUtils._confirmationDialog.getConfirmationDialogConfirmBtn());

    await KMElement.waitToDisappear(ProjectUtils._projectsPage.getProjectItem(projectName));
    expect(await ProjectUtils._projectsPage.getProjectItem(projectName).isPresent()).toBeFalsy();
  }
}
