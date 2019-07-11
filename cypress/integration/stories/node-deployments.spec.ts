import {ClustersPage} from "../../pages/clusters.po";
import {NodeDeploymentDetailsPage} from "../../pages/node-deployment-details.po.ts";
import {ProjectsPage} from "../../pages/projects.po";
import {WizardPage} from "../../pages/wizard.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {Datacenter, Provider} from "../../utils/provider";
import {wait} from "../../utils/wait";

describe('Node Deployments story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const digitaloceanToken = Cypress.env('DO_E2E_TESTS_TOKEN');
  let projectName = 'e2e-test-project';
  const clusterName = 'e2e-test-cluster';
  const initialNodeDeploymentName = 'e2e-test-nd';
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
    ProjectsPage.addProjectBtn().click();
    
    ProjectsPage.addDialogInput().type(projectName).should(Condition.HaveValue, projectName);
    ProjectsPage.addDialogSaveBtn().click();
  });
  
  it('should create a new cluster', () => {
    ProjectsPage.select(projectName);
    ClustersPage.visit();
    wait('**/me');
    ClustersPage.addClusterBtn().should(Condition.NotBe, 'disabled');
    ClustersPage.addClusterBtn().click();

    wait('**/cluster?type=kubernetes');
    WizardPage.clusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.nextBtn().should(Condition.NotBe, 'disabled');
    WizardPage.nextBtn().click();
    WizardPage.providerBtn(Provider.Digitalocean).click();
    WizardPage.datacenterBtn(Datacenter.Frankfurt).click();
    WizardPage.digitaloceanTokenInput().type(digitaloceanToken).should(Condition.HaveValue, digitaloceanToken);
    wait('**/providers/digitalocean/sizes');
    WizardPage.nodeNameInput().type(initialNodeDeploymentName).should(Condition.HaveValue, initialNodeDeploymentName);
    WizardPage.nodeCountInput().clear().type(initialNodeDeploymentReplicas).should(Condition.HaveValue, initialNodeDeploymentReplicas);
    WizardPage.nextBtn().should(Condition.NotBe, 'disabled');
    WizardPage.nextBtn().click();
    WizardPage.createBtn().should(Condition.NotBe, 'disabled');
    WizardPage.createBtn().click();

    cy.url().should(Condition.Contain, '/clusters');
  });

  it('should check if cluster was created', () => {
    ClustersPage.visit();
    ClustersPage.table().should(Condition.Contain, clusterName);
  });

  it('should wait for initial node deployment to be created', () => {
    ClustersPage.clusterItem(clusterName).click();
    wait('**/nodedeployments', 'GET', 'getNodeDeployments', 600000);
    cy.get('kubermatic-node-deployment-list').should(Condition.Contain, initialNodeDeploymentName);
  });

  it('should go to node deployment details', () => {
    ClustersPage.tableRowNodeDeploymentNameColumn(initialNodeDeploymentName).click();
  });

  it('should verify node deployment name', () => {
    NodeDeploymentDetailsPage.nodeDeploymentNameElement().should(Condition.Contain, initialNodeDeploymentName);
  });

  it('should verify node deployment cluster name', () => {
    NodeDeploymentDetailsPage.nodeDeploymentClusterNameElement().should(Condition.Contain, clusterName);
  });

  it('should go back to cluster details page and remove initial node deployment', () => {
    ClustersPage.visit();
    wait('**/clusters');
    ClustersPage.table().should(Condition.Contain, clusterName);
    ClustersPage.clusterItem(clusterName).click();

    cy.get('kubermatic-node-deployment-list').should(Condition.Contain, initialNodeDeploymentName);
    ClustersPage.nodeDeploymentRemoveBtn(initialNodeDeploymentName).click();
    ClustersPage.deleteNodeDeploymentDialogBtn().click();
    ClustersPage.tableRowNodeDeploymentNameColumn(initialNodeDeploymentName).should(Condition.NotExist);
  });

  it('should delete created cluster', () => {
    ClustersPage.visit();
    ClustersPage.clusterItem(clusterName).click();

    ClustersPage.deleteClusterBtn().click();
    ClustersPage.deleteDialogInput().type(clusterName).should(Condition.HaveValue, clusterName);
    ClustersPage.deleteDialogBtn().click();

    wait('**/clusters');
    cy.url().should(Condition.Contain, '/clusters');
    cy.get('div').should(Condition.Contain, 'No Clusters available. Please add a new Cluster.');
  });
  
  it('should delete created project', () => {
    ProjectsPage.visit();
    ProjectsPage.deleteProjectBtn(projectName).click();
    ProjectsPage.deleteDialogInput().type(projectName).should(Condition.HaveValue, projectName);
    ProjectsPage.deleteDialogConfirmBtn().click();
  });
  
  it('should logout', () => {
    logout();
  });
});
