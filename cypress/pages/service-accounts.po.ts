import {Group} from "../utils/member";
import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";

export class ServiceAccountsPage {
  static getAddServiceAccountBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-top-btn');
  }

  static getAddServiceAccountNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-dialog-name-input');
  }

  static getAddServiceAccountGroupCombobox(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-dialog-group-combobox');
  }

  static getAddServiceAccountGroupOption(group: Group): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', group);
  }

  static getAddServiceAccountSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-dialog-add-btn');
  }

  static getDeleteServiceAccountBtn(name: string): Cypress.Chainable<any> {
    return this.getTableRow(name).find('button i.km-icon-delete');
  }

  static getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static getAddTokenBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-token');
  }

  static getAddTokenNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-token-dialog-name-input');
  }

  static getAddTokenSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-token-dialog-add-btn');
  }

  static getTokenGotItBtn(): Cypress.Chainable<any> {
    return cy.get('#km-token-dialog-confirm-btn');
  }

  static _waitForTokenRefresh(): void {
    wait('**/tokens', 'GET', 'list service account tokens');
  }

  static getTableRow(name: string): Cypress.Chainable<any> {
    return cy.get('td').contains(name).parent();
  }

  // Utils.

  static waitForRefresh(): void {
    wait('**/serviceaccounts', 'GET', 'list service accounts');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'serviceaccounts');
  }

  static visit(): void {
    cy.get('#km-nav-item-service-accounts').click();
    this.waitForRefresh();
    this.verifyUrl();
  }

  static addServiceAccount(name: string, group: Group): void {
    this.getAddServiceAccountBtn().should(Condition.NotBe, 'disabled').click();
    this.getAddServiceAccountNameInput().type(name).should(Condition.HaveValue, name);
    this.getAddServiceAccountGroupCombobox().click();
    this.getAddServiceAccountGroupOption(group).click();
    this.getAddServiceAccountSaveBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.Contain, name);
  }

  static deleteServiceAccount(name: string): void {
    this.getDeleteServiceAccountBtn(name).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.NotContain, name);
  }

  static addToken(name: string): void {
    this.getAddTokenBtn().click();
    this.getAddTokenNameInput().type(name).should(Condition.HaveValue, name);
    this.getAddTokenSaveBtn().should(Condition.NotBe, 'disabled').click();
    this._waitForTokenRefresh();
    this.getTokenGotItBtn().should(Condition.NotBe, 'disabled').click();
  }
}
