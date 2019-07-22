export class LoginPage {
  static getLoginBtn(): Cypress.Chainable<any> {
    return cy.get('#login-button');
  }

  static getLogoutBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-logout-btn');
  }

  static getLogoutMenuBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-user-menu');
  }

  // Utils.

  static visit(): void {
    cy.visit('/');
  }
}
