import {browser} from "protractor";
import {KMElement} from "../utils/element";
import {ClustersPage} from "../pages/clusters/clusters.po";
import {WizardPage} from "../pages/wizard/wizard.po";
import {RandomUtils} from '../utils/random';
import { ProjectUtils } from '../utils/project';
import { AuthUtils } from '../utils/auth';

describe('Node Deployments story', () => {
  const clustersPage = new ClustersPage();
  const wizardPage = new WizardPage();

  const projectName = RandomUtils.prefixedString('e2e-test-project');
  const clusterName = RandomUtils.prefixedString('e2e-test-cluster');
  const initialNodeDeploymentName = RandomUtils.prefixedString('e2e-test-nd');
  const providerName = 'digitalocean';
  const datacenterLocation = 'Frankfurt';

  beforeAll(() => {
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
    ProjectUtils.createProject(projectName);
  });

  it('should go to clusters page', () => {
    clustersPage.navigateTo();
    KMElement.waitForClickable(clustersPage.getAddClusterTopBtn());
  });

  it('should click on add cluster button', () => {
    clustersPage.getCreateClusterNavButton().click();
  });

  it('should set cluster name', () => {
    KMElement.waitToAppear(wizardPage.getClusterNameInput());
    wizardPage.getClusterNameInput().sendKeys(clusterName);
    KMElement.waitForClickable(wizardPage.getNextButton());
    wizardPage.getNextButton().click();
  });

  it('should set the provider', () => {
    KMElement.waitToAppear(wizardPage.getProviderButton(providerName));
    wizardPage.getProviderButton(providerName).click();
  });

  it('should set the datacenter location', () => {
    wizardPage.getDatacenterLocationButton(datacenterLocation).click();
  });

  it('should set the provider settings', () => {
    wizardPage.getDigitalOceanTokenInput().sendKeys(browser.params.KUBERMATIC_E2E_DIGITALOCEAN_TOKEN);
    wizardPage.getNodeNameInput().sendKeys(initialNodeDeploymentName);

    KMElement.waitForClickable(wizardPage.getNextButton());
    wizardPage.getNextButton().click();
  });

  it('should confirm cluster creation', () => {
    KMElement.waitForClickable(wizardPage.getCreateButton());
    wizardPage.getCreateButton().click();
    KMElement.waitForRedirect('/clusters/');
  });

  it('check if cluster was created', () => {
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

  afterAll(() => {
    ProjectUtils.deleteProject(projectName);
    AuthUtils.logout();
  });
});
