export class UserPanel {
  static getUserPanelMenuBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-user-menu');
  }

  static getLogoutBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-logout-btn');
  }

  static getUserSettingsBtn(): Cypress.Chainable<any> {
    return cy.get('#km-navbar-user-settings-btn');
  }

  // Utils.

  static open(): void {
    this.getUserPanelMenuBtn().click();
  }

  static openUserSettings(): void {
    this.open();
    this.getUserSettingsBtn().click();
  }

  static logout(): void {
    this.open();
    this.getLogoutBtn().click();
  }
}
