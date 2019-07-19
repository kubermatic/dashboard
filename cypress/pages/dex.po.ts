export class DexPage {
  static getLoginWithEmailBtn(): Cypress.Chainable<any> {
    return cy.get('a').contains('Log in with Email');
  }

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
