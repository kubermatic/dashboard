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
import { ConfirmationUtils } from '../utils/confirmation';

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

  it('should create a new cluster', async () => {
    await clustersPage.navigateTo();

    await KMElement.click(clustersPage.getAddClusterTopBtn());

    await KMElement.fill(wizardPage.getClusterNameInput(), clusterName);

    await KMElement.click(wizardPage.getNextButton());

    await KMElement.click(wizardPage.getProviderButton(providerName));

    await KMElement.click(wizardPage.getDatacenterLocationButton(datacenterLocation));

    await KMElement.click(wizardPage.getCreateButton());

    await KMElement.waitForRedirect('/clusters/');

    await clustersPage.navigateTo();

    await KMElement.waitToAppear(clustersPage.getClusterItem(clusterName));
    expect(await clustersPage.getClusterItem(clusterName).isPresent()).toBeTruthy();
  });

  it('should add a new member', async () => {
    await membersPage.navigateTo();

    await KMElement.click(membersPage.getAddMemberBtn());

    await KMElement.waitToAppear(membersPage.getAddMemberDialog());
    await KMElement.fill(membersPage.getAddMemberDialogEmailInput(), memberEmail);

    await KMElement.click(membersPage.getAddMemberDialogGroupCombobox());
    await KMElement.click(membersPage.getAddMemberDialogGroupOption(2));
    await KMElement.click(membersPage.getAddMemberDialogAddBtn());

    await KMElement.waitToDisappear(membersPage.getAddMemberDialog());
    await KMElement.waitToAppear(membersPage.getMemberItem(memberEmail));

    expect(await membersPage.getMemberItem(memberEmail).isPresent()).toBeTruthy();
  });

  it('should edit created member info', async () => {
    const memberGroup = await membersPage.getMemberGroup(memberEmail).getText();

    await KMElement.click(membersPage.getMemberEditBtn(memberEmail));

    await KMElement.click(membersPage.getEditMemberDialogGroupCombobox());
    await KMElement.click(membersPage.getEditMemberDialogGroupOption(3));
    await KMElement.click(membersPage.getEditMemberDialogEditBtn());

    await KMElement.waitToDisappear(membersPage.getEditMemberDialog());

    // Switch views to reload members list
    await clustersPage.navigateTo();
    await membersPage.navigateTo();

    await KMElement.waitToAppear(membersPage.getMemberItem(memberEmail));
    expect(await membersPage.getMemberGroup(memberEmail).getText()).not.toEqual(memberGroup);
  });

  it('should delete created member', async () => {
    await KMElement.click(membersPage.getMemberDeleteBtn(memberEmail));

    await ConfirmationUtils.confirm();

    // Switch views to reload members list
    await clustersPage.navigateTo();
    await membersPage.navigateTo();

    expect(await membersPage.getMemberItem(memberEmail).isPresent()).toBeFalsy();
  });

  it('should delete created cluster', async () => {
    await ClusterUtils.deleteCluster(clusterName);
  });

  it('should edit created project name', async () => {
    const oldProjectName = projectName;
    projectName = RandomUtils.prefixedString('e2e-test-project');

    await projectsPage.navigateTo();

    await KMElement.click(projectsPage.getProjectEditBtn(oldProjectName));

    expect(await projectsPage.getEditProjectDialog().isPresent()).toBeTruthy();
    await KMElement.fill(projectsPage.getEditProjectDialogInput(), projectName);
    await KMElement.click(projectsPage.getEditProjectDialogEditBtn());
    await KMElement.waitToDisappear(projectsPage.getEditProjectDialog());

    await KMElement.waitForRedirect('/clusters');

    // We need to wait for autoredirect after edit to finish
    // otherwise it will autoredirect again after too fast page switch.
    await browser.sleep(5000);

    await projectsPage.navigateTo();
    await KMElement.waitForRedirect('/projects');

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
