import {ProjectsPage} from "../../pages/projects.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {prefixedString} from "../../utils/random";

describe('Service Accounts Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = prefixedString('e2e-test-project');

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
