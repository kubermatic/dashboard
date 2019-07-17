export class LoginPage {
  static visit(): void {
    cy.visit('/');
  }

  static loginBtn(): Cypress.Chainable<any> {
    return cy.get('#login-button');
  }

  static logoutBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-logout-btn');
  }
}
