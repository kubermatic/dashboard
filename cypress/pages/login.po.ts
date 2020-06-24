export class LoginPage {
  static getLoginBtn(): Cypress.Chainable<any> {
    return cy.get('#login-button');
  }

  // Utils.

  static visit(): void {
    cy.visit('/');
  }
}
