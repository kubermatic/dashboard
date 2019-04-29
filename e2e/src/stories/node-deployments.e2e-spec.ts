import {browser} from 'protractor';

import {ClustersPage} from '../pages/clusters/clusters.po';
import {NodeDeploymentDetailsPage} from '../pages/node-deployment-details/node-deployment-details.po';
import {WizardPage} from '../pages/wizard/wizard.po';
import {AuthUtils} from '../utils/auth';
import {ClusterUtils} from '../utils/cluster';
import {KMElement} from '../utils/element';
import {ProjectUtils} from '../utils/project';
import {RandomUtils} from '../utils/random';
import {ConfirmationUtils} from '../utils/confirmation';
import {minute} from '../utils/constants';

describe('Node Deployments story', () => {
  const clustersPage = new ClustersPage();
  const wizardPage = new WizardPage();
  const nodeDeploymentDetailsPage = new NodeDeploymentDetailsPage();

  const projectName = RandomUtils.prefixedString('e2e-test-project');
  const clusterName = RandomUtils.prefixedString('e2e-test-cluster');
  const initialNodeDeploymentName = RandomUtils.prefixedString('e2e-test-nd');
  const providerName = 'digitalocean';
  const datacenterLocation = 'Frankfurt';

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

  it('should set the provider settings', async () => {
    await KMElement.fill(wizardPage.getDigitalOceanTokenInput(), browser.params.KUBERMATIC_E2E_DIGITALOCEAN_TOKEN);
    await KMElement.fill(wizardPage.getNodeNameInput(), initialNodeDeploymentName);

    await KMElement.click(wizardPage.getNextButton());
  });

  it('should confirm cluster creation', async () => {
    await KMElement.click(wizardPage.getCreateButton());

    await KMElement.waitForRedirect('/clusters/');
  });

  it('check if cluster was created', async () => {
    await clustersPage.navigateTo();

    await KMElement.waitToAppear(clustersPage.getClusterItem(clusterName));
    expect(await clustersPage.getClusterItem(clusterName).isDisplayed()).toBeTruthy();
  });

  it('should go to the cluster details page', async () => {
    await clustersPage.navigateTo();

    await KMElement.click(clustersPage.getClusterItem(clusterName));
  });

  it('should wait for initial node deployment to be created', async () => {
    await KMElement.waitToAppear(clustersPage.getNodeDeploymentItem(initialNodeDeploymentName), 10 * minute);
  });

  it('should go to node deployment details', async () => {
    await KMElement.click(clustersPage.getNodeDeploymentItem(initialNodeDeploymentName));
  });

  it('should verify node deployment name', async () => {
    await KMElement.waitToAppear(nodeDeploymentDetailsPage.getNodeDeploymentNameElement(), 10 * minute);
    expect(await nodeDeploymentDetailsPage.getNodeDeploymentNameElement().getText()).toEqual(initialNodeDeploymentName);
  });

  it('should verify node deployment cluster name', async () => {
    await KMElement.waitToAppear(nodeDeploymentDetailsPage.getNodeDeploymentClusterNameElement(), 10 * minute);
    expect(await nodeDeploymentDetailsPage.getNodeDeploymentClusterNameElement().getText()).toEqual(clusterName);
  });

  it('should verify node deployment status', async () => {
    const expectedStatus = 'Running';
    await KMElement.waitForContent(nodeDeploymentDetailsPage.getNodeDeploymentStatusElement(), expectedStatus, 10 * minute);
    expect(await nodeDeploymentDetailsPage.getNodeDeploymentStatusElement().getText()).toEqual(expectedStatus);
  });

  it('should go to the cluster details page', async () => {
    await clustersPage.navigateTo();
    await KMElement.click(clustersPage.getClusterItem(clusterName));
  });

  it('should remove initial node deployment', async () => {
    await KMElement.click(clustersPage.getNodeDeploymentRemoveBtn(initialNodeDeploymentName));

    await ConfirmationUtils.confirm();
  });

  it('should verify initial node deployment removal', async () => {
    await browser.sleep(minute);

    await KMElement.waitToDisappear(clustersPage.getNodeDeploymentItem(initialNodeDeploymentName));
    expect(await browser.isElementPresent(clustersPage.getNodeDeploymentItem(initialNodeDeploymentName))).toBeFalsy();
  });

  it('should delete created cluster', async () => {
    await ClusterUtils.deleteCluster(clusterName, 10 * minute);
  });

  it('should delete created project', async () => {
    await ProjectUtils.goBackToProjects();

    await ProjectUtils.deleteProject(projectName);
  });

  it('should logout', async () => {
    await AuthUtils.logout();
  });
});
