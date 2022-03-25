import {Config} from '../../../utils/config';
import {View} from '../../../utils/view';
import {Page, PageOptions} from '../types';
import {LoginStrategyFactory} from './strategy/factory';
import {LoginStrategy} from './strategy/types';

export class RootPage extends PageOptions implements Page {
  private readonly _loginStrategy: LoginStrategy;

  constructor(isAPIMocked: boolean) {
    super();

    this._loginStrategy = LoginStrategyFactory.new(isAPIMocked);
  }

  visit(): void {
    cy.visit(View.Login.Default);
  }

  login(email = Config.userEmail(), password = Config.password(), isAdmin = false): void {
    this._loginStrategy.login(email, password, isAdmin);
  }

  logout(): void {
    this._loginStrategy.logout();
  }
}
