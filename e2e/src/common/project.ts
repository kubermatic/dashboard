import {KMElement} from '../shared/element';
import { browser } from 'protractor';
import { ProjectsPage } from '../projects/projects.po';
import { ConfirmationDialog } from '../shared/confirmation.po';

export class ProjectCommons {
  private static _projectsPage = new ProjectsPage();
  private static _confirmationDialog = new ConfirmationDialog();

  static createProject(projectName: string): void {
    ProjectCommons._projectsPage.navigateTo();
    KMElement.waitToAppear(ProjectCommons._projectsPage.getAddProjectButton());

    ProjectCommons._projectsPage.getAddProjectButton().click();
    expect(ProjectCommons._projectsPage.getAddProjectDialog().isPresent()).toBeTruthy();

    ProjectCommons._projectsPage.getProjectNameInput().sendKeys(projectName);
    ProjectCommons._projectsPage.getSaveProjectButton().click();

    KMElement.waitToDisappear(ProjectCommons._projectsPage.getAddProjectDialog());
    KMElement.waitForRedirect("/clusters");

    // We need to wait for autoredirect after create to finish
    // otherwise it will autoredirect again after too fast page switch.
    browser.sleep(5000);

    ProjectCommons._projectsPage.navigateTo();
    KMElement.waitForRedirect("/projects");
    KMElement.waitToAppear(ProjectCommons._projectsPage.getProjectItem(projectName));

    expect(ProjectCommons._projectsPage.getProjectItem(projectName).isPresent()).toBeTruthy();
  }

  static deleteProject(projectName: string): void {
    ProjectCommons._projectsPage.navigateTo();
    KMElement.waitForRedirect('/projects');

    KMElement.waitToAppear(ProjectCommons._projectsPage.getDeleteProjectButton(projectName));
    ProjectCommons._projectsPage.getDeleteProjectButton(projectName).click();
    expect(ProjectCommons._confirmationDialog.getConfirmationDialog().isPresent()).toBeTruthy();

    KMElement.sendKeys(ProjectCommons._confirmationDialog.getConfirmationDialogInput(), projectName);
    ProjectCommons._confirmationDialog.getConfirmationDialogConfirmBtn().click();

    KMElement.waitToDisappear(ProjectCommons._projectsPage.getProjectItem(projectName));
    expect(ProjectCommons._projectsPage.getProjectItem(projectName).isPresent()).toBeFalsy();
  }
}
