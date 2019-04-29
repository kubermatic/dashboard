import {ClustersPage} from "../../pages/clusters.po";
import {MembersPage} from "../../pages/members.po";
import {ProjectsPage} from "../../pages/projects.po";
import {WizardPage} from "../../pages/wizard.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {Group} from "../../utils/member";
import {Datacenter, Provider} from "../../utils/provider";
import {wait} from "../../utils/wait";

describe('Basic story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const newUserEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const projectName = 'e2e-test-project';
  const clusterName = 'e2e-test-cluster';
  
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
    
    // Autoredirect to an empty clusters view
    wait('**/projects');
    cy.url().should(Condition.Contain, '/clusters');
    cy.get('div').should(Condition.Contain, 'No Clusters available. Please add a new Cluster.');
  });
  
  it('should create a new cluster', () => {
    ClustersPage.visit();
    ClustersPage.addClusterBtn().click();

    WizardPage.clusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.nextBtn().click();
    WizardPage.providerBtn(Provider.BringYourOwn).click();
    WizardPage.datacenterBtn(Datacenter.Frankfurt).click();
    WizardPage.createBtn().click();

    cy.url().should(Condition.Contain, '/clusters');
  });
  
  it('should add a new member', () => {
    MembersPage.visit();
    
    wait('**/users');
    
    MembersPage.addMemberBtn().click();
    MembersPage.addMemberDialogEmailInput().type(newUserEmail).should(Condition.HaveValue, newUserEmail);
    MembersPage.addMemberDialogGroupCombobox().click();
    MembersPage.memberDialogGroup(Group.Editor).click();
    MembersPage.addMemberDialogSaveBtn().click();
    
    MembersPage.table().should(Condition.Contain, newUserEmail);
  });
  
  it('should edit created member info', () => {
    MembersPage.editBtn(newUserEmail).click();
    MembersPage.editMemberDialogGroupCombobox().click();
    MembersPage.memberDialogGroup(Group.Viewer).click();
    MembersPage.editMemberDialogSaveBtn().click();
  
    wait('**/users', 'GET', 'listUsers');
    
    ProjectsPage.visit();
    MembersPage.visit();
    
    MembersPage.tableRowGroupColumn(newUserEmail).should(Condition.Contain, Group.Viewer);
  });
  
  it('should delete created member', () => {
    MembersPage.deleteBtn(newUserEmail).click();
    MembersPage.deleteMemberDialogDeleteBtn().click();
  
    wait('**/users', 'GET', 'listUsers');
    
    ProjectsPage.visit();
    MembersPage.visit();
    
    MembersPage.tableRowEmailColumn(newUserEmail).should(Condition.NotExist);
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
  
  it('should edit created project name', () => {
  
  });
  
  it('should delete created project', () => {
    ProjectsPage.visit();
    
    ProjectsPage.deleteProjectBtn(projectName).click();
    ProjectsPage.deleteDialogInput().type(projectName);
    ProjectsPage.deleteDialogConfirmBtn().click();
  });
  
  it('should logout', () => {
    logout();
  });
});
