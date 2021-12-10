// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Condition} from '../utils/condition';
import {Endpoint} from '../utils/endpoint';
import {RequestType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';

export class ClusterTemplatesPage {
  static getTemplateInstanceBtn(name: string): Cypress.Chainable {
    return cy.get(`#km-template-instance-${name}`);
  }

  static getCreateTemplateInstanceBtn(): Cypress.Chainable {
    return cy.get('#km-create-template-instance-btn');
  }

  // Utils

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().url(Endpoint.ClusterTemplates).method(RequestType.GET).interceptAndWait();
  }

  static visit(): void {
    cy.get('#km-nav-item-cluster-templates')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.ClusterTemplates.Default);
  }
}
