// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
