export class DexPage {
  static loginWithEmailBtn(): Cypress.Chainable<any> {
    return cy.get('a').contains('Log in with Email');
  }

  static loginInput(): Cypress.Chainable<any> {
    return cy.get('input#login');
  }

  static passwordInput(): Cypress.Chainable<any> {
    return cy.get('input#password');
  }

  static loginBtn(): Cypress.Chainable<any> {
    return cy.get('button#submit-login');
  }
}
