import {ClustersPage} from "../../pages/clusters.po";
import {MembersPage} from "../../pages/members.po";
import {ProjectsPage} from "../../pages/projects.po";
import {WizardPage} from "../../pages/wizard.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {Group, reloadUsers} from "../../utils/member";
import {Datacenter, Provider} from "../../utils/provider";
import {prefixedString} from "../../utils/random";

describe('Basic Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const newUserEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  let projectName = prefixedString('e2e-test-project');
  const clusterName = prefixedString('e2e-test-cluster');
  
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
    WizardPage.getProviderBtn(Provider.BringYourOwn).click();
    WizardPage.getDatacenterBtn(Datacenter.Frankfurt).click();
    WizardPage.getCreateBtn().click();

    ClustersPage.verifyUrl();
  });

  it('should go to members view', () => {
    MembersPage.visit();
  });

  it('should add a new member', () => {
    MembersPage.addMember(newUserEmail, Group.Editor);
  });

  it('should edit created member info', () => {
    reloadUsers();
    MembersPage.editMember(newUserEmail, Group.Viewer);
    reloadUsers();
    MembersPage.getTableRowGroupColumn(newUserEmail).should(Condition.Contain, Group.Viewer);
  });

  it('should delete created member', () => {
    reloadUsers();
    MembersPage.getDeleteBtn(newUserEmail).click();
    MembersPage.getDeleteMemberDialogDeleteBtn().click();
    reloadUsers();
    MembersPage.getTableRowEmailColumn(newUserEmail).should(Condition.NotExist);
  });

  it('should delete created cluster', () => {
    ClustersPage.visit();
    ClustersPage.getClusterItem(clusterName).click();

    ClustersPage.getDeleteClusterBtn().click();
    ClustersPage.getDeleteDialogInput().type(clusterName).should(Condition.HaveValue, clusterName);
    ClustersPage.getDeleteDialogBtn().click();

    ClustersPage.waitForRefresh();
    cy.url().should(Condition.Contain, '/clusters');
    cy.get('div').should(Condition.Contain, 'No Clusters available. Please add a new Cluster.');
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });
  
  it('should edit created project name', () => {
    ProjectsPage.getEditProjectBtn(projectName).click();

    projectName = `${projectName}-edited`;
    ProjectsPage.getEditDialogInput().type('-edited').should(Condition.HaveValue, projectName);
    ProjectsPage.getEditDialogConfirmBtn().click();

    ProjectsPage.waitForRefresh();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
  });
  
  it('should logout', () => {
    logout();
  });
});
