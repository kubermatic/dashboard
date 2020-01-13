export class DexPage {
  static getLoginInput(): Cypress.Chainable<any> {
    return cy.get('input#login');
  }

  static getPasswordInput(): Cypress.Chainable<any> {
    return cy.get('input#password');
  }

  static getLoginBtn(): Cypress.Chainable<any> {
    return cy.get('button#submit-login');
  }
}
