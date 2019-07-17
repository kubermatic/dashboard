import {MembersPage} from "../../pages/members.po";
import {ProjectsPage} from "../../pages/projects.po";
import {login, logout} from "../../utils/auth";
import {Condition} from "../../utils/condition";
import {Group, reloadUsers} from "../../utils/member";
import {prefixedString} from "../../utils/random";

describe('Multi owner story', () => {
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
    ProjectsPage.addProjectBtn().click();
    
    ProjectsPage.addDialogInput().type(projectName).should(Condition.HaveValue, projectName);
    ProjectsPage.addDialogSaveBtn().should(Condition.NotBe, 'disabled');
    ProjectsPage.addDialogSaveBtn().click();
    ProjectsPage.table().should(Condition.Contain, projectName);
  });
  
  it('should add a new member', () => {
    ProjectsPage.selectProject(projectName);
    MembersPage.visit();

    MembersPage.addMemberBtn().click();
    MembersPage.addMemberDialogEmailInput().type(newUserEmail).should(Condition.HaveValue, newUserEmail);
    MembersPage.addMemberDialogGroupCombobox().click();
    MembersPage.memberDialogGroup(Group.Owner).click();
    MembersPage.addMemberDialogSaveBtn().click();

    MembersPage.table().should(Condition.Contain, newUserEmail);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as a second owner', () => {
    login(newUserEmail, password);
    cy.url().should(Condition.Include, 'projects');
  });

  it('should check if multi owner project is in list', () => {
    ProjectsPage.table().should(Condition.Contain, projectName);
  });

  it('should delete first owner from project', () => {
    ProjectsPage.selectProject(projectName);
    MembersPage.visit();

    MembersPage.deleteBtn(email).click();
    MembersPage.deleteMemberDialogDeleteBtn().click();

    reloadUsers();

    MembersPage.tableRowEmailColumn(email).should(Condition.NotExist);
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
