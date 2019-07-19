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

  private static _getDeleteServiceAccountBtn(name: string): Cypress.Chainable<any> {
    return this.getTableRow(name).find('button i.km-icon-delete');
  }

  private static _getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  private static _getAddTokenBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-token');
  }

  private static _getAddTokenNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-token-dialog-name-input');
  }

  private static _getAddTokenSaveBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-serviceaccount-token-dialog-add-btn');
  }

  private static _getTokenGotItBtn(): Cypress.Chainable<any> {
    return cy.get('#km-token-dialog-confirm-btn');
  }

  private static _waitForTokenRefresh(): void {
    wait('**/tokens', 'GET', 'list service account tokens');
  }

  static getTableRow(name: string): Cypress.Chainable<any> {
    return cy.get('td').contains(name).parent();
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

  static deleteServiceAccount(name: string): void {
    this._getDeleteServiceAccountBtn(name).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this._getTable().should(Condition.NotContain, name);
  }

  static addToken(name: string): void {
    this._getAddTokenBtn().click();
    this._getAddTokenNameInput().type(name).should(Condition.HaveValue, name);
    this._getAddTokenSaveBtn().should(Condition.NotBe, 'disabled').click();
    this._waitForTokenRefresh();
    this._getTokenGotItBtn().should(Condition.NotBe, 'disabled').click();
  }
}
