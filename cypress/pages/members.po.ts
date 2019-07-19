import {Group} from "../utils/member";
import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";

export class MembersPage {
  static getAddMemberBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-top-btn');
  }

  static getAddMemberDialogEmailInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-dialog-email-input');
  }

  static getAddMemberDialogGroupCombobox(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-dialog-group-combobox');
  }

  static getAddMemberDialogSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-member-dialog-add-btn');
  }

  static getMemberDialogGroup(group: Group): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', group);
  }

  static getEditMemberDialogGroupCombobox(): Cypress.Chainable<any> {
    return cy.get('#km-edit-member-dialog-group-combobox');
  }

  static getEditBtn(email: string): Cypress.Chainable<any> {
    return this.getTableRow(email).find('button i.km-icon-edit');
  }

  static getDeleteBtn(email: string): Cypress.Chainable<any> {
    return this.getTableRow(email).find('button i.km-icon-delete');
  }

  static getEditMemberDialogSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-edit-member-dialog-edit-btn');
  }

  static getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static getTableRow(email: string): Cypress.Chainable<any> {
    return this.getTableRowEmailColumn(email).parent();
  }

  static getTableRowEmailColumn(email: string): Cypress.Chainable<any> {
    return cy.get('td').contains(email);
  }

  static getTableRowGroupColumn(email: string): Cypress.Chainable<any> {
    return this.getTableRow(email).find('td.mat-column-group');
  }

  static getDeleteMemberDialogDeleteBtn(): Cypress.Chainable<any> {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  // Utils.

  static waitForRefresh(): void {
    wait('**/users', 'GET', 'list members');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'members');
  }

  static visit(): void {
    cy.get('#km-nav-item-members').click();
    this.waitForRefresh();
    this.verifyUrl();
  }

  static addMember(email: string, group: Group): void {
    this.getAddMemberBtn().should(Condition.NotBe, 'disabled').click();
    this.getAddMemberDialogEmailInput().type(email).should(Condition.HaveValue, email);
    this.getAddMemberDialogGroupCombobox().click();
    this.getMemberDialogGroup(group).click();
    this.getAddMemberDialogSaveBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.Contain, email);
  }

  static editMember(email: string, newGroup: Group): void {
    this.getEditBtn(email).click();
    this.getEditMemberDialogGroupCombobox().click();
    this.getMemberDialogGroup(newGroup).click();
    this.getEditMemberDialogSaveBtn().click();
  }
}
