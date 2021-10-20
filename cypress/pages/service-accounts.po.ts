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
import {Group} from '../utils/member';
import {Mocks} from '../utils/mocks';
import {Response, RequestType, ResponseType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';

export class ServiceAccountsPage {
  static getAddServiceAccountBtn(): Cypress.Chainable {
    return cy.get('#km-add-serviceaccount-top-btn');
  }

  static getAddServiceAccountNameInput(): Cypress.Chainable {
    return cy.get('#km-add-serviceaccount-dialog-name-input');
  }

  static getMemberDialogGroup(group: Group): Cypress.Chainable {
    return cy.get('mat-radio-button').contains('div', group);
  }

  static getAddServiceAccountSaveBtn(): Cypress.Chainable {
    return cy.get('#km-add-serviceaccount-dialog-add-btn');
  }

  static getDeleteServiceAccountBtn(name: string): Cypress.Chainable {
    return this.getTableRow(name).find('button i.km-icon-delete');
  }

  static getTable(): Cypress.Chainable {
    return cy.get('tbody');
  }

  static getAddTokenBtn(): Cypress.Chainable {
    return cy.get('#km-add-serviceaccount-token');
  }

  static getAddTokenNameInput(): Cypress.Chainable {
    return cy.get('#km-serviceaccount-token-dialog-name-input');
  }

  static getAddTokenSaveBtn(): Cypress.Chainable {
    return cy.get('#km-serviceaccount-token-dialog-update-btn');
  }

  static getTokenGotItBtn(): Cypress.Chainable {
    return cy.get('#km-serviceaccount-token-dialog-confirm-btn');
  }

  static _waitForTokenRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.Tokens).interceptAndWait();
  }

  static getTableRow(name: string): Cypress.Chainable {
    return cy.get('td').contains(name).parent();
  }

  // Utils.

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.ServiceAccounts).interceptAndWait();
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.ServiceAccounts.Default);
  }

  static visit(): void {
    cy.get('#km-nav-item-service-accounts')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static addServiceAccount(name: string, group: Group): void {
    this.getAddServiceAccountBtn().should(Condition.NotBe, 'disabled').click();
    this.getAddServiceAccountNameInput().type(name).should(Condition.HaveValue, name);
    this.getMemberDialogGroup(group).click();
    this.getAddServiceAccountSaveBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.Contain, name);
  }

  static deleteServiceAccount(name: string): void {
    this.getDeleteServiceAccountBtn(name).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  }

  static verifyNoServiceAccounts(): void {
    if (Mocks.enabled()) {
      cy.intercept({method: RequestType.GET, path: Endpoint.ServiceAccounts}, []);
    }

    this.verifyUrl();

    const retries = 5;
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.ServiceAccounts)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(0));
  }

  static addToken(name: string): void {
    this.getAddTokenBtn().click();
    this.getAddTokenNameInput().type(name).should(Condition.HaveValue, name);
    this.getAddTokenSaveBtn().should(Condition.NotBe, 'disabled').click();
    this._waitForTokenRefresh();
    this.getTokenGotItBtn().should(Condition.NotBe, 'disabled').click();
  }
}
