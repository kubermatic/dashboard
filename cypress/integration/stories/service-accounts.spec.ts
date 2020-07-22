import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {prefixedString} from '../../utils/random';
import {ServiceAccountsPage} from '../../pages/service-accounts.po';
import {Group} from '../../utils/member';
import {View} from '../../utils/view';

describe('Service Accounts Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = prefixedString('e2e-test-project');
  const serviceAccountName = 'test-sa';
  const tokenName = 'test-token';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects);
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

  it('should add token', () => {
    ServiceAccountsPage.addToken(tokenName);
  });

  it('should close token panel for created service account', () => {
    ServiceAccountsPage.getTableRow(serviceAccountName).click();
  });

  it('should delete service account', () => {
    ServiceAccountsPage.deleteServiceAccount(serviceAccountName);
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
