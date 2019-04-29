import {browser} from 'protractor';

import {ClustersPage} from '../pages/clusters/clusters.po';
import {MembersPage} from '../pages/member/member';
import {ProjectsPage} from '../pages/projects/projects.po';
import {WizardPage} from '../pages/wizard/wizard.po';
import {AuthUtils} from '../utils/auth';
import {KMElement} from '../utils/element';
import {ProjectUtils} from '../utils/project';
import {RandomUtils} from '../utils/random';
import {ClusterUtils} from '../utils/cluster';
import {ConfirmationUtils} from '../utils/confirmation';
import {minute} from "../utils/constants";

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

  let projectName = RandomUtils.prefixedString('e2e-test-project');
  const clusterName = RandomUtils.prefixedString('e2e-test-cluster');
  const providerName = 'bringyourown';
  const datacenterLocation = 'Frankfurt';

  const memberEmail = 'roxy2@loodse.com';

  it('should login', async () => {
    await AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should create a new project', async () => {
    await ProjectUtils.createProject(projectName);
  });

  it('should select the new project', async () => {
    await ProjectUtils.selectProject(projectName);
  });

  it('should go to clusters page', async () => {
    await clustersPage.navigateTo();
  });

  it('should click on add cluster button', async () => {
    await KMElement.click(clustersPage.getAddClusterTopBtn());
  });

  it('should set cluster name', async () => {
    await KMElement.fill(wizardPage.getClusterNameInput(), clusterName);
    await KMElement.click(wizardPage.getNextButton());
  });

  it('should set the provider', async () => {
    await KMElement.click(wizardPage.getProviderButton(providerName));
  });

  it('should set the datacenter location', async () => {
    await KMElement.click(wizardPage.getDatacenterLocationButton(datacenterLocation));
  });

  it('should confirm cluster creation', async () => {
    await KMElement.click(wizardPage.getCreateButton());
  });

  it('should wait for redirect to cluster details', async () => {
    await KMElement.waitForRedirect('/clusters/');
  });

  it('should go back to clusters page', async () => {
    await clustersPage.navigateTo();
  });

  it('should check if cluster was created', async () => {
    await KMElement.waitToAppear(clustersPage.getClusterItem(clusterName));
    expect(await clustersPage.getClusterItem(clusterName).isDisplayed()).toBeTruthy();
  });

  it('should go to the members page', async () => {
    await membersPage.navigateTo();
  });

  it('should open add member dialog', async () => {
    await KMElement.click(membersPage.getAddMemberBtn());
    await KMElement.waitToAppear(membersPage.getAddMemberDialog());
  });

  it('should fill member email', async () => {
    await KMElement.fill(membersPage.getAddMemberDialogEmailInput(), memberEmail);
  });

  it('should fill member role', async () => {
    await KMElement.click(membersPage.getAddMemberDialogGroupCombobox());
    await KMElement.click(membersPage.getAddMemberDialogGroupOption(2));
  });

  it('should confirm member creation', async () => {
    await KMElement.click(membersPage.getAddMemberDialogAddBtn());
    await KMElement.waitToDisappear(membersPage.getAddMemberDialog());
  });

  it('should wait for member to appear on the list', async () => {
    await KMElement.waitToAppear(membersPage.getMemberItem(memberEmail));
    expect(await membersPage.getMemberItem(memberEmail).isDisplayed()).toBeTruthy();
  });

  it('should edit created member info', async () => {
    const memberGroup = await membersPage.getMemberGroup(memberEmail).getText();

    await KMElement.click(membersPage.getMemberEditBtn(memberEmail));

    await KMElement.click(membersPage.getEditMemberDialogGroupCombobox());
    await KMElement.click(membersPage.getEditMemberDialogGroupOption(3));
    await KMElement.click(membersPage.getEditMemberDialogEditBtn());

    await KMElement.waitToDisappear(membersPage.getEditMemberDialog());

    await browser.sleep(minute);

    await KMElement.waitToAppear(membersPage.getMemberItem(memberEmail));
    expect(await membersPage.getMemberGroup(memberEmail).getText()).not.toEqual(memberGroup);
  });

  it('should click delete member button', async () => {
    await KMElement.click(membersPage.getMemberDeleteBtn(memberEmail));
  });

  it('should confirm member deletion', async () => {
    await ConfirmationUtils.confirm();
  });

  it('should verify that member was deleted', async () => {
    await KMElement.waitToDisappear(membersPage.getMemberItem(memberEmail));
    expect(await browser.isElementPresent(membersPage.getMemberItem(memberEmail))).toBeFalsy();
  });

  it('should delete created cluster', async () => {
    await ClusterUtils.deleteCluster(clusterName);
  });

  it('should edit created project name', async () => {
    const oldProjectName = projectName;
    projectName = RandomUtils.prefixedString('e2e-test-project');

    await ProjectUtils.goBackToProjects();

    await KMElement.click(projectsPage.getProjectEditBtn(oldProjectName));

    expect(await projectsPage.getEditProjectDialog().isDisplayed()).toBeTruthy();
    await KMElement.fill(projectsPage.getEditProjectDialogInput(), projectName);
    await KMElement.click(projectsPage.getEditProjectDialogEditBtn());
    await KMElement.waitToDisappear(projectsPage.getEditProjectDialog());

    await KMElement.waitToAppear(projectsPage.getProjectItem(projectName));
    expect(await projectsPage.getProjectItem(projectName).getText()).not.toEqual(oldProjectName);
  });

  it('should delete created project', async () => {
    await ProjectUtils.deleteProject(projectName);
  });

  it('should logout', async () => {
    await AuthUtils.logout();
  });
});
