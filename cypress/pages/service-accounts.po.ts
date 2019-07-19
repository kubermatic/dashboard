import {Group} from "../utils/member";
import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";

export class ServiceAccountsPage {
  private static _getAddServiceAccountBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-top-btn');
  }

  private static _getAddServiceAccountNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-dialog-name-input');
  }

  private static _getAddServiceAccountGroupCombobox(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-dialog-group-combobox');
  }

  private static _getAddServiceAccountGroupOption(group: Group): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', group);
  }

  private static _getAddServiceAccountSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-dialog-add-btn');
  }

  private static _getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static getTableRow(name: string): Cypress.Chainable<any> {
    return cy.get('td').contains(name).parent();
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
    this._getAddServiceAccountBtn().should(Condition.NotBe, 'disabled').click();
    this._getAddServiceAccountNameInput().type(name).should(Condition.HaveValue, name);
    this._getAddServiceAccountGroupCombobox().click();
    this._getAddServiceAccountGroupOption(group).click();
    this._getAddServiceAccountSaveBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this._getTable().should(Condition.Contain, name);
  }
}
