import {Condition} from "../utils/condition";
import {wait} from "../utils/wait";
import {ClustersPage} from "./clusters.po";

export class ProjectsPage {
  private static _getProjectItem(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-project-name-${projectName}`);
  }

  private static _getActiveProjects(): Cypress.Chainable<any> {
    return cy.get('i.km-health-state.fa.fa-circle.green');
  }

  private static _getAddProjectBtn(): Cypress.Chainable<any> {
    return cy.get(`#km-add-project-top-btn`);
  }

  private static _getAddProjectInput(): Cypress.Chainable<any> {
    return cy.get(`#km-add-project-dialog-input`);
  }

  private static _getAddProjectConfirmBtn(): Cypress.Chainable<any> {
    return cy.get(`#km-add-project-dialog-save`);
  }

  private static _getDeleteProjectBtn(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-delete-project-${projectName}`);
  }

  static getEditProjectBtn(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-edit-project-${projectName}`);
  }

  static getEditDialogInput(): Cypress.Chainable<any> {
    return cy.get('#km-edit-project-dialog-input');
  }

  static getEditDialogConfirmBtn(): Cypress.Chainable<any> {
    return cy.get('#km-edit-project-dialog-edit-btn');
  }

  static getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static waitForRefresh(): void {
    wait('**/projects', 'GET', 'list projects');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'projects');
  }

  static visit(): void {
    cy.get('#km-nav-item-projects').click();
    this.waitForRefresh();
    this.verifyUrl();
  }

  static selectProject(projectName: string): void {
    this._getProjectItem(projectName).should(Condition.HaveLength, 1);
    this._getActiveProjects().should(Condition.HaveLength, 1).click();
    ClustersPage.waitForRefresh();
    ClustersPage.verifyUrl();
  }

  static addProject(projectName: string): void {
    this._getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    this._getAddProjectInput().type(projectName).should(Condition.HaveValue, projectName);
    this._getAddProjectConfirmBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.Contain, projectName);
  }

  static deleteProject(projectName: string): void {
    this._getDeleteProjectBtn(projectName).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  }
}
