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

export class WizardPage {
  static getNextBtn(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-next-btn');
  }

  static getClusterNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-name-input');
  }

  static getCreateBtn(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-create-btn');
  }

  static getProviderBtn(providerName: string): Cypress.Chainable<any> {
    return cy.get(`.km-provider-logo-${providerName}`);
  }

  static getDatacenterBtn(datacenterName: string): Cypress.Chainable<any> {
    return cy.get('button').contains('.km-location', datacenterName);
  }

  static getCustomPresetsCombobox(): Cypress.Chainable<any> {
    return cy.get('.km-custom-credentials-select');
  }

  static getCustomPresetsValue(presetName: string): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', presetName);
  }

  static getNodeNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-node-name-input');
  }

  static getNodeCountInput(): Cypress.Chainable<any> {
    return cy.get('#km-node-count-input');
  }

  // Utils.

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'wizard');
  }
}
