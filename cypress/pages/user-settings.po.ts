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

import {Condition} from '../utils/condition';
import {View} from '../utils/view';
import {UserPanel} from './user-panel.po';
import {RequestType, TrafficMonitor} from "../utils/monitor";
import {Endpoint} from "../utils/endpoint";

export class UserSettingsPage {
  static getThemePicker(): Cypress.Chainable<any> {
    return cy.get('#km-theme-picker');
  }

  // Utils.

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Account);
  }

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.Settings).wait();
  }

  static visit(): void {
    UserPanel.open();
    UserPanel.getUserSettingsBtn().click().then(() => {
      this.waitForRefresh();
      this.verifyUrl();
    });
  }
}
