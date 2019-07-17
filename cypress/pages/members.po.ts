import {Group} from "../utils/member";
import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";

export class MembersPage {
  static addMemberBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-top-btn');
  }

  static addMemberDialogEmailInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-dialog-email-input');
  }

  static addMemberDialogGroupCombobox(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-dialog-group-combobox');
  }

  static addMemberDialogSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-dialog-add-btn');
  }

  static memberDialogGroup(group: Group): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', group);
  }

  static editMemberDialogGroupCombobox(): Cypress.Chainable<any> {
    return cy.get('#km-edit-member-dialog-group-combobox');
  }

  static editBtn(email: string): Cypress.Chainable<any> {
    return MembersPage.tableRow(email).find('button i.km-icon-edit');
  }

  static deleteBtn(email: string): Cypress.Chainable<any> {
    return MembersPage.tableRow(email).find('button i.km-icon-delete');
  }

  static editMemberDialogSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-edit-member-dialog-edit-btn');
  }

  static table(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static tableRow(email: string): Cypress.Chainable<any> {
    return MembersPage.tableRowEmailColumn(email).parent();
  }

  static tableRowEmailColumn(email: string): Cypress.Chainable<any> {
    return cy.get('td').contains(email);
  }

  static tableRowGroupColumn(email: string): Cypress.Chainable<any> {
    return MembersPage.tableRow(email).find('td.mat-column-group');
  }

  static deleteMemberDialogDeleteBtn(): Cypress.Chainable<any> {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  static waitForRefresh(): void {
    wait('**/users', 'GET', 'list members');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'members');
  }

  static visit(): void {
    cy.get('#km-nav-item-members').click();
    this.verifyUrl();
    this.waitForRefresh();
  }
}
