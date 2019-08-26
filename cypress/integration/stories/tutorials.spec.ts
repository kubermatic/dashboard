import {TutorialProjectsPage} from "../../pages/tutorial-projects.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {prefixedString} from "../../utils/random";



describe('Tutorials Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  let projectName = prefixedString('e2e-test-project');

 
  before(() => {
    cy.clearCookies();
  });
  
  beforeEach(() => {
    cy.server();
    Cypress.Cookies.preserveOnce('token', 'nonce');
  });
  

  it('tutorials 01: should create a new project', () => {
    login(email, password);
    cy.url().should(Condition.Include, 'projects');
    TutorialProjectsPage.addProject(projectName);
  });


  it('tutorials 01: should delete the project', () => {
    TutorialProjectsPage.deleteProject(projectName);
    logout();
  });
  
});

