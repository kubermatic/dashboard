import {PageOptions} from '../types';

export class DexPage extends PageOptions {
  readonly Elements = new Elements();
  readonly Buttons = new Buttons();

  constructor() {
    super();
  }

  login(email: string, password: string): void {
    this.Elements.loginPanel.then(element => {
      if (this.Buttons.hasLoginWithEmailOption(element)) {
        this.Buttons.loginWithEmail.click();
      }
    });

    this.Elements.loginInput.type(email);
    this.Elements.passwordInput.type(password);
    this.Buttons.login.click();
  }
}

class Elements extends PageOptions {
  get loginInput(): Cypress.Chainable {
    return cy.get('input#login');
  }

  get passwordInput(): Cypress.Chainable {
    return cy.get('input#password');
  }

  get loginPanel(): Cypress.Chainable {
    return cy.get('.theme-form-row');
  }
}

class Buttons extends PageOptions {
  get login(): Cypress.Chainable {
    return cy.get('button#submit-login');
  }

  get loginWithEmail(): Cypress.Chainable {
    return cy.get('.dex-btn-text').contains('Log in with Email');
  }

  hasLoginWithEmailOption(element: any): boolean {
    return element.find('.dex-btn-text').text('Log in with Email').length > 0;
  }
}
