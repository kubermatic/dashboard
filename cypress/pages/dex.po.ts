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

  static getLoginPanel(): Cypress.Chainable {
    return cy.get('.theme-form-row');
  }

  static getLoginWithEmailBtn(): Cypress.Chainable {
    return cy.get('.dex-btn-text').contains('Log in with Email');
  }

  static hasLoginWithEmailBtn(element: any): boolean {
    return element.find('.dex-btn-text').text('Log in with Email').length > 0;
  }
}
