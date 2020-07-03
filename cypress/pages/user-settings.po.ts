// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {wait} from '../utils/wait';
import {Condition} from '../utils/condition';
import {UserPanel} from './user-panel.po';

export class UserSettingsPage {
  static getThemePicker(): Cypress.Chainable<any> {
    return cy.get('#km-theme-picker');
  }

  // Utils.

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'account');
  }

  static waitForRefresh(): void {
    wait('**/me/settings', 'GET', 'get user settings');
  }

  static visit(): void {
    UserPanel.openUserSettings();
    this.waitForRefresh();
    this.verifyUrl();
  }
}
