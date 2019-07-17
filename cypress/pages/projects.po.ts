import {Condition} from "../utils/condition";

export class ProjectsPage {
  private static _getAddProjectBtn(): Cypress.Chainable<any> {
    return cy.get(`#km-add-project-top-btn`);
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

  static visit(): void {
    cy.get('#km-nav-item-projects').click();
  }

  static selectProject(projectName: string): void {
    cy.get(`#km-project-name-${projectName}`).should(Condition.HaveLength, 1);
    cy.get('i.km-health-state.fa.fa-circle.green').should(Condition.HaveLength, 1).click();
  }

  static addProject(projectName: string): void {
    this._getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    cy.get('#km-add-project-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-add-project-dialog-save').should(Condition.NotBe, 'disabled').click();
  }

  static deleteProject(projectName: string): void {
    this._getDeleteProjectBtn(projectName).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  }
}
