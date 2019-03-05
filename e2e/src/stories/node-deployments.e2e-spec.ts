import {ProjectsPage} from "../projects/projects.po";
import {browser} from "protractor";
import {ConfirmationDialog} from "../shared/confirmation.po";
import {KMElement} from "../utils/element";
import {ClustersPage} from "../clusters/clusters.po";
import {CreateClusterPage} from "../clusters/create/create.po";
import {AuthUtils} from '../utils/login';

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
  const createClusterPage = new CreateClusterPage();
  const confirmationDialog = new ConfirmationDialog();

  let projectName = 'e2e-test-project';
  const clusterName = 'e2e-test-cluster';
  const providerName = 'bringyourown';
  const datacenterLocation = 'Frankfurt';

  it('should login', () => {
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should create a new project', () => {
    projectsPage.navigateTo();
    KMElement.waitToAppear(projectsPage.getAddProjectButton());

    projectsPage.getAddProjectButton().click();
    expect(projectsPage.getAddProjectDialog().isPresent()).toBeTruthy();

    projectsPage.getProjectNameInput().sendKeys(projectName);
    projectsPage.getSaveProjectButton().click();

    KMElement.waitToDisappear(projectsPage.getAddProjectDialog());
    KMElement.waitForRedirect("/clusters");
    // We need to wait for autoredirect after create to finish otherwise it will autoredirect again after too fast page switch.
    browser.sleep(5000);
    projectsPage.navigateTo();
    KMElement.waitForRedirect("/projects");
    KMElement.waitToAppear(projectsPage.getProjectItem(projectName));

    expect(projectsPage.getProjectItem(projectName).isPresent()).toBeTruthy();
  });

  it('should create a new cluster', () => {
    clustersPage.navigateTo();
    KMElement.waitForClickable(clustersPage.getAddClusterTopBtn());

    clustersPage.getCreateClusterNavButton().click();
    KMElement.waitToAppear(createClusterPage.getClusterNameInput());
    createClusterPage.getClusterNameInput().sendKeys(clusterName);
    KMElement.waitForClickable(createClusterPage.getNextButton());
    createClusterPage.getNextButton().click();

    KMElement.waitToAppear(createClusterPage.getProviderButton(providerName));
    createClusterPage.getProviderButton(providerName).click();

    createClusterPage.getDatacenterLocationButton(datacenterLocation).click();

    KMElement.waitForClickable(createClusterPage.getCreateButton());
    createClusterPage.getCreateButton().click();
    KMElement.waitForRedirect('/clusters/');

    clustersPage.navigateTo();
    KMElement.waitToAppear(clustersPage.getClusterItem(clusterName));
    expect(clustersPage.getClusterItem(clusterName).isPresent()).toBeTruthy();
  });

  it('should delete created cluster', () => {
    clustersPage.navigateTo();

    KMElement.waitToAppear(clustersPage.getClusterItem(clusterName));
    clustersPage.getClusterItem(clusterName).click();

    KMElement.waitForClickable(clustersPage.getDeleteClusterBtn());
    clustersPage.getDeleteClusterBtn().click();

    KMElement.waitToAppear(clustersPage.getDeleteClusterDialog());
    KMElement.sendKeys(clustersPage.getDeleteClusterDialogInput(), clusterName);
    KMElement.waitForClickable(clustersPage.getDeleteClusterDialogDeleteBtn());
    clustersPage.getDeleteClusterDialogDeleteBtn().click();

    KMElement.waitToAppear(clustersPage.getAddClusterTopBtn());
    KMElement.waitToDisappear(clustersPage.getClusterItem(clusterName));
    expect(clustersPage.getClusterItem(clusterName).isPresent()).toBeFalsy();
  });

  it('should delete created project', () => {
    KMElement.waitToAppear(projectsPage.getDeleteProjectButton(projectName));
    projectsPage.getDeleteProjectButton(projectName).click();
    expect(confirmationDialog.getConfirmationDialog().isPresent()).toBeTruthy();

    KMElement.sendKeys(confirmationDialog.getConfirmationDialogInput(), projectName);
    confirmationDialog.getConfirmationDialogConfirmBtn().click();

    KMElement.waitToDisappear(projectsPage.getProjectItem(projectName));
    expect(projectsPage.getProjectItem(projectName).isPresent()).toBeFalsy();
  });

  it('should logout', () => {
    AuthUtils.logout();
  });
});
