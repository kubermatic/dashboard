import {ClustersPage} from "../../pages/clusters.po";
import {NodeDeploymentDetailsPage} from "../../pages/node-deployment-details.po";
import {ProjectsPage} from "../../pages/projects.po";
import {WizardPage} from "../../pages/wizard.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {Datacenter, Provider} from "../../utils/provider";
import {prefixedString} from "../../utils/random";
import {wait} from "../../utils/wait";

describe('Node Deployments Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = prefixedString('e2e-test-project');
  const clusterName = prefixedString('e2e-test-cluster');
  const initialNodeDeploymentName = prefixedString('e2e-test-nd');
  const initialNodeDeploymentReplicas = '1';

  before(() => {
    cy.clearCookies();
  });

  beforeEach(() => {
    cy.server();
    Cypress.Cookies.preserveOnce('token', 'nonce');
  });

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, 'projects');
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to wizard', () => {
    ClustersPage.openWizard();
  });

  it('should create a new cluster', () => {
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn().click();
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Frankfurt).click();
    WizardPage.getCustomPresetsCombobox().click();
    WizardPage.getCustomPresetsValue('loodse').click();
    wait('**/providers/digitalocean/sizes');
    WizardPage.getNodeNameInput().type(initialNodeDeploymentName).should(Condition.HaveValue, initialNodeDeploymentName);
    WizardPage.getNodeCountInput().clear().type(initialNodeDeploymentReplicas).should(Condition.HaveValue, initialNodeDeploymentReplicas);
    WizardPage.getNextBtn().click();
    WizardPage.getCreateBtn().click();

    cy.url().should(Condition.Contain, '/clusters');
  });

  it('should check if cluster was created', () => {
    ClustersPage.visit();
    ClustersPage.getTable().should(Condition.Contain, clusterName);
  });

  it('should wait for initial node deployment to be created', () => {
    ClustersPage.getClusterItem(clusterName).click();
    wait('**/nodedeployments', 'GET', 'getNodeDeployments', 900000);
    cy.get('kubermatic-node-deployment-list', {timeout: 900000}).should(Condition.Contain, initialNodeDeploymentName);
  });

  it('should go to node deployment details', () => {
    ClustersPage.getTableRowNodeDeploymentNameColumn(initialNodeDeploymentName).click();
  });

  it('should verify node deployment name', () => {
    NodeDeploymentDetailsPage.getNodeDeploymentNameElement().should(Condition.Contain, initialNodeDeploymentName);
  });

  it('should verify node deployment cluster name', () => {
    NodeDeploymentDetailsPage.getNodeDeploymentClusterNameElement().should(Condition.Contain, clusterName);
  });

  it('should go back to cluster details page and remove initial node deployment', () => {
    NodeDeploymentDetailsPage.getBackToClusterBtn().click();
    cy.url().should(Condition.Contain, '/clusters');
    cy.get('mat-card-title').should(Condition.Contain, clusterName);
    cy.get('kubermatic-node-deployment-list').should(Condition.Contain, initialNodeDeploymentName);

    ClustersPage.getNodeDeploymentRemoveBtn(initialNodeDeploymentName).click();
    ClustersPage.getDeleteNodeDeploymentDialogBtn().click();
    ClustersPage.getTableRowNodeDeploymentNameColumn(initialNodeDeploymentName).should(Condition.NotExist);
  });

  it('should delete created cluster', () => {
    ClustersPage.deleteCluster(clusterName);
  });

  it('should verify that there are no clusters', () => {
    ClustersPage.verifyNoClusters();
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
  });

  it('should logout', () => {
    logout();
  });
});
