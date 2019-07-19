import {MembersPage} from "../../pages/members.po";
import {ProjectsPage} from "../../pages/projects.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {Group, reloadUsers} from "../../utils/member";
import {prefixedString} from "../../utils/random";
import {ClustersPage} from "../../pages/clusters.po";

describe('Multi owner Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const newUserEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const projectName = prefixedString('e2e-test-project');
  
  before(() => {
    cy.clearCookies();
  });

  beforeEach(() => {
    cy.server();
    Cypress.Cookies.preserveOnce('token', 'nonce');
  });

  it('should login as a first owner', () => {
    login(email, password);
    cy.url().should(Condition.Include, 'projects');
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to members view', () => {
    MembersPage.visit();
  });

  it('should add a new member', () => {
    MembersPage.addMember(newUserEmail, Group.Owner);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as a second owner', () => {
    login(newUserEmail, password);
    cy.url().should(Condition.Include, 'projects');
  });

  it('should wait for autoredirect and go back to projects', () => {
    ClustersPage.waitForRefresh();
    ProjectsPage.visit();
  });

  it('should check if multi owner project is in list', () => {
    ProjectsPage.getTable().should(Condition.Contain, projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to members view', () => {
    MembersPage.visit();
  });

  it('should delete first owner from project', () => {
    MembersPage.getDeleteBtn(email).click();
    MembersPage.getDeleteMemberDialogDeleteBtn().click();

    reloadUsers();

    MembersPage.getTableRowEmailColumn(email).should(Condition.NotExist);
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
