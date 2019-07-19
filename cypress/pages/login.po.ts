export class LoginPage {
  static getLoginBtn(): Cypress.Chainable<any> {
    return cy.get('#login-button');
  }

  static getLogoutBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-logout-btn');
  }

  // Utils.

  static visit(): void {
    cy.visit('/');
  }
}
