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
import {Mocks} from '../utils/mocks';
import {RequestType, ResponseCheck, ResponseType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';

export class SSHKeysPage {
  static getAddSSHKeyButton(): Cypress.Chainable {
    return cy.get('#km-add-ssh-key-top-btn');
  }

  static getAddSSHKeyNameInput(): Cypress.Chainable {
    return cy.get('#name');
  }

  static getAddSSHKeyTextarea(): Cypress.Chainable {
    return cy.get('#key');
  }

  static getAddSSHKeySaveButton(): Cypress.Chainable {
    return cy.get('#km-add-ssh-key-dialog-save');
  }

  static getDeleteSSHKeyButton(name: string): Cypress.Chainable {
    return cy.get(`#km-delete-sshkey-${name}`);
  }

  static getDeleteSSHKeyConfirmationButton(): Cypress.Chainable {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  static getTable(): Cypress.Chainable {
    return cy.get('tbody');
  }

  static getTableRow(name: string): Cypress.Chainable {
    return cy.get('td').contains(name).parent();
  }

  // Utils.

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.SSHKeys).interceptAndWait();
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.SSHKeys.Default);
  }

  static visit(): void {
    cy.get('#km-nav-item-sshkeys')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static addServiceAccount(name: string, sshKeyPublic: string): void {
    this.getAddSSHKeyButton().should(Condition.NotBe, 'disabled').click();
    this.getAddSSHKeyNameInput().type(name).should(Condition.HaveValue, name);
    this.getAddSSHKeyTextarea().type(sshKeyPublic).should(Condition.HaveValue, sshKeyPublic);
    this.getAddSSHKeySaveButton().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.Contain, name);
  }

  static deleteServiceAccount(name: string): void {
    this.getDeleteSSHKeyButton(name).should(Condition.NotBe, 'disabled').click();
    this.getDeleteSSHKeyConfirmationButton().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.NotContain, name);
  }

  static verifyNoSSHKeys(): void {
    if (Mocks.enabled()) {
      cy.intercept({method: RequestType.GET, path: Endpoint.SSHKeys}, []);
    }

    this.verifyUrl();

    const retries = 5;
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.SSHKeys)
      .retry(retries)
      .expect(new ResponseCheck(ResponseType.LIST).elements(0));
  }
}
