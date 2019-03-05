import {browser} from "protractor";
import {KMElement} from "../shared/element";
import {ClustersPage} from "../clusters/clusters.po";
import {CreateClusterPage} from "../clusters/create/create.po";
import {RandomUtils} from '../shared/random';
import { ProjectCommons } from '../common/project';
import { AuthCommons } from '../common/auth';

describe('Node Deployments story', () => {
  const clustersPage = new ClustersPage();
  const createClusterPage = new CreateClusterPage();

  const projectName = `e2e-test-project-${RandomUtils.string()}`;
  const clusterName = `e2e-test-cluster-${RandomUtils.string()}`;
  const initialNodeDeploymentName = `e2e-test-nd-${RandomUtils.string()}`;
  const providerName = 'digitalocean';
  const datacenterLocation = 'Frankfurt';

  beforeAll(() => {
    AuthCommons.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
    ProjectCommons.createProject(projectName);
  });

  it('should go to clusters page', () => {
    clustersPage.navigateTo();
    KMElement.waitForClickable(clustersPage.getAddClusterTopBtn());
  });

  it('should click on add cluster button', () => {
    clustersPage.getCreateClusterNavButton().click();
  });

  it('should set cluster name', () => {
    KMElement.waitToAppear(createClusterPage.getClusterNameInput());
    createClusterPage.getClusterNameInput().sendKeys(clusterName);
    KMElement.waitForClickable(createClusterPage.getNextButton());
    createClusterPage.getNextButton().click();
  });

  it('should set the provider', () => {
    KMElement.waitToAppear(createClusterPage.getProviderButton(providerName));
    createClusterPage.getProviderButton(providerName).click();
  });

  it('should set the datacenter location', () => {
    createClusterPage.getDatacenterLocationButton(datacenterLocation).click();
  });

  it('should set the provider settings', () => {
    createClusterPage.getDigitalOceanTokenInput().sendKeys(browser.params.KUBERMATIC_E2E_DIGITALOCEAN_TOKEN);
    createClusterPage.getNodeNameInput().sendKeys(initialNodeDeploymentName);

    KMElement.waitForClickable(createClusterPage.getNextButton());
    createClusterPage.getNextButton().click();
  });

  it('should confirm cluster creation', () => {
    KMElement.waitForClickable(createClusterPage.getCreateButton());
    createClusterPage.getCreateButton().click();
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
    ProjectCommons.deleteProject(projectName);
    AuthCommons.logout();
  });
});
