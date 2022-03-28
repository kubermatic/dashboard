import {Config} from '../../../utils/config';
import {View} from '../../../utils/view';
import {Page, PageOptions} from '../types';
import {LoginStrategyFactory} from './strategy/factory';
import {LoginStrategy} from './strategy/types';

export class RootPage extends PageOptions implements Page {
  private readonly _loginStrategy: LoginStrategy;

  readonly UserPanel = new UserPanel();
  readonly Buttons = new Buttons();

  constructor(isAPIMocked: boolean) {
    super();

    this._loginStrategy = LoginStrategyFactory.new(isAPIMocked, this);
  }

  visit(): void {
    cy.visit(View.Root.Default);
  }

  login(email = Config.userEmail(), password = Config.password(), isAdmin = false): void {
    this._loginStrategy.login(email, password, isAdmin);
  }

  logout(): void {
    this._loginStrategy.logout();
  }
}

class UserPanel extends PageOptions {
  get open(): Cypress.Chainable {
    return cy.get('#km-navbar-user-menu');
  }

  get logout(): Cypress.Chainable {
    return cy.get('#km-navbar-logout-btn');
  }

  get userSettings(): Cypress.Chainable {
    return cy.get('#km-navbar-user-settings-btn');
  }

  get adminSetttings(): Cypress.Chainable {
    return cy.get('#km-navbar-admin-settings-btn');
  }
}

class Buttons extends PageOptions {
  get login(): Cypress.Chainable {
    return cy.get('#login-button');
  }
}
