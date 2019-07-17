import {ProjectsPage} from "../../pages/projects.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {prefixedString} from "../../utils/random";
import {ServiceAccountsPage} from "../../pages/service-accounts.po";
import {Group} from "../../utils/member";

describe('Service Accounts Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = prefixedString('e2e-test-project');
  const serviceAccountName = 'test-sa';
  const tokenName = 'test-token';

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

  it('should go to the service accounts page', () => {
    ServiceAccountsPage.visit();
  });

  it('should create new service account', () => {
    ServiceAccountsPage.addServiceAccount(serviceAccountName, Group.Editor);
  });

  it('should open token panel for created service account', () => {
    ServiceAccountsPage.getTableRow(serviceAccountName).click();
  });

  it('should open add token dialog', () => {
    ServiceAccountsPage.getAddTokenBtn().click();
  });

  it('should add token', () => {
    ServiceAccountsPage.getAddTokenNameInput().type(tokenName).should(Condition.HaveValue, tokenName);
    ServiceAccountsPage.getAddTokenSaveBtn().should(Condition.NotBe, 'disabled').click();

    // todo add dialog utils and close the window
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
