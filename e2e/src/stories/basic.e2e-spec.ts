import {browser} from 'protractor';

import {ClustersPage} from '../pages/clusters/clusters.po';
import {MembersPage} from '../pages/member/member';
import {ProjectsPage} from '../pages/projects/projects.po';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';
import {WizardPage} from '../pages/wizard/wizard.po';
import {AuthUtils} from '../utils/auth';
import {KMElement} from '../utils/element';
import {ProjectUtils} from '../utils/project';
import {RandomUtils} from '../utils/random';
import {ClusterUtils} from '../utils/cluster';

/**
 * This is the user story that tests basic kubermatic dashboard features such as:
 *  - login/logout
 *  - CRUD for projects, clusters, members
 *
 * It executes the following steps:
 *  - Login using static credentials as test user 'roxy'
 *  - Create new project called 'e2e-test-project'
 *  - Create new cluster called 'e2e-test-cluster' using kubeadm provider
 *  - Add new member
 *  - Edit group of added member
 *  - Delete created resources (member, cluster, project).
 *  - Logout from the application
 */

describe('Basic story', () => {
  const projectsPage = new ProjectsPage();
  const clustersPage = new ClustersPage();
  const wizardPage = new WizardPage();
  const membersPage = new MembersPage();
  const confirmationDialog = new ConfirmationDialog();

  let projectName = RandomUtils.prefixedString('e2e-test-project');
  const clusterName = RandomUtils.prefixedString('e2e-test-cluster');
  const providerName = 'bringyourown';
  const datacenterLocation = 'Frankfurt';

  const memberEmail = 'roxy2@kubermatic.io';

  it('should login', () => {
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should create a new project', () => {
    ProjectUtils.createProject(projectName);
  });

  it('should create a new cluster', () => {
    clustersPage.navigateTo();
    KMElement.waitForClickable(clustersPage.getAddClusterTopBtn());

    clustersPage.getCreateClusterNavButton().click();
    KMElement.waitToAppear(wizardPage.getClusterNameInput());
    wizardPage.getClusterNameInput().sendKeys(clusterName);
    KMElement.waitForClickable(wizardPage.getNextButton());
    wizardPage.getNextButton().click();

    KMElement.waitToAppear(wizardPage.getProviderButton(providerName));
    wizardPage.getProviderButton(providerName).click();

    wizardPage.getDatacenterLocationButton(datacenterLocation).click();

    KMElement.waitForClickable(wizardPage.getCreateButton());
    wizardPage.getCreateButton().click();
    KMElement.waitForRedirect('/clusters/');

    clustersPage.navigateTo();
    KMElement.waitToAppear(clustersPage.getClusterItem(clusterName));
    expect(clustersPage.getClusterItem(clusterName).isPresent()).toBeTruthy();
  });

  it('should add a new member', () => {
    membersPage.navigateTo();

    KMElement.waitForClickable(membersPage.getAddMemberBtn());
    membersPage.getAddMemberBtn().click();
    KMElement.waitToAppear(membersPage.getAddMemberDialog());

    KMElement.sendKeys(membersPage.getAddMemberDialogEmailInput(), memberEmail);
    membersPage.getAddMemberDialogGroupCombobox().click();
    membersPage.getAddMemberDialogGroupOption(2).click();
    membersPage.getAddMemberDialogAddBtn().click();

    KMElement.waitToDisappear(membersPage.getAddMemberDialog());
    KMElement.waitToAppear(membersPage.getMemberItem(memberEmail));
    expect(membersPage.getMemberItem(memberEmail).isPresent()).toBeTruthy();
  });

  it('should edit created member info', async () => {
    const memberGroup = await membersPage.getMemberGroup(memberEmail).getText();
    KMElement.waitToAppear(membersPage.getMemberEditBtn(memberEmail));
    membersPage.getMemberEditBtn(memberEmail).click();

    KMElement.waitToAppear(membersPage.getEditMemberDialogGroupCombobox());
    membersPage.getEditMemberDialogGroupCombobox().click();
    membersPage.getEditMemberDialogGroupOption(3).click();
    membersPage.getEditMemberDialogEditBtn().click();

    KMElement.waitToDisappear(membersPage.getEditMemberDialog());

    // Switch views to reload members list
    clustersPage.navigateTo();
    membersPage.navigateTo();

    KMElement.waitToAppear(membersPage.getMemberItem(memberEmail));
    expect(await membersPage.getMemberGroup(memberEmail).getText()).not.toEqual(memberGroup);
  });

  it('should delete created member', () => {
    KMElement.waitToAppear(membersPage.getMemberDeleteBtn(memberEmail));
    membersPage.getMemberDeleteBtn(memberEmail).click();

    KMElement.waitToAppear(confirmationDialog.getConfirmationDialog());
    confirmationDialog.getConfirmationDialogConfirmBtn().click();

    // Switch views to reload members list
    clustersPage.navigateTo();
    membersPage.navigateTo();

    expect(membersPage.getMemberItem(memberEmail).isPresent()).toBeFalsy();
  });

  it('should delete created cluster', () => {
    ClusterUtils.deleteCluster(clusterName);
  });

  it('should edit created project name', async () => {
    const oldProjectName = projectName;
    projectsPage.navigateTo();
    KMElement.waitForNotifications();

    KMElement.waitToAppear(projectsPage.getProjectEditBtn(projectName));
    projectsPage.getProjectEditBtn(projectName).click();
    expect(projectsPage.getEditProjectDialog().isPresent()).toBeTruthy();

    KMElement.waitToAppear(projectsPage.getEditProjectDialogInput());
    projectName = RandomUtils.prefixedString('e2e-test-project');
    KMElement.sendKeys(projectsPage.getEditProjectDialogInput(), projectName);
    KMElement.waitForClickable(projectsPage.getEditProjectDialogEditBtn());
    projectsPage.getEditProjectDialogEditBtn().click();

    KMElement.waitToDisappear(projectsPage.getEditProjectDialog());

    KMElement.waitForRedirect('/clusters');

    // We need to wait for autoredirect after edit to finish
    // otherwise it will autoredirect again after too fast page switch.
    browser.sleep(5000);

    projectsPage.navigateTo();
    KMElement.waitForRedirect('/projects');

    KMElement.waitToAppear(projectsPage.getProjectItem(projectName));
    expect(await projectsPage.getProjectItem(projectName).getText()).not.toEqual(oldProjectName);
  });

  it('should delete created project', () => {
    ProjectUtils.deleteProject(projectName);
  });

  it('should logout', () => {
    AuthUtils.logout();
  });
});
