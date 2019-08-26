import {Condition} from "../utils/condition";
import {wait} from "../utils/wait";

export class TutorialProjectsPage {
  static getProjectItem(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-project-name-${projectName}`);
  }

  static getActiveProjects(): Cypress.Chainable<any> {
    return cy.get('i.km-health-state.fa.fa-circle.green');
  }

  // main difference to projects.po: this selects the button not by id but by the text "Add Project"
  static getAddProjectBtn(): Cypress.Chainable<any> {
    return cy.contains('Add Project');
  }

  static getAddProjectInput(): Cypress.Chainable<any> {
    return cy.get(`#km-add-project-dialog-input`);
  }

  static addProject(projectName: string): void {
    this.getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    this.getAddProjectInput().type(projectName).should(Condition.HaveValue, projectName);
    this.getAddProjectConfirmBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.Contain, projectName);
  }

  static getAddProjectConfirmBtn(): Cypress.Chainable<any> {
    return cy.get(`#km-add-project-dialog-save`);
  }

  static getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  // Utils.

  static waitForRefresh(): void {
    wait('**/projects', 'GET', 'list projects');
  }

  static getDeleteProjectBtn(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-delete-project-${projectName}`);
  }

  static deleteProject(projectName: string): void {
    this.getDeleteProjectBtn(projectName).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  }
}


