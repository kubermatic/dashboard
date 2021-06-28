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
import {Endpoint} from '../utils/endpoint';
import {Group} from '../utils/member';
import {RequestType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';

export class MembersPage {
  static getAddMemberBtn(): Cypress.Chainable {
    return cy.get('#km-add-member-top-btn');
  }

  static getAddMemberDialogEmailInput(): Cypress.Chainable {
    return cy.get('#km-add-member-dialog-email-input');
  }

  static getAddMemberDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-add-member-dialog-add-btn');
  }

  static getMemberDialogGroup(group: Group): Cypress.Chainable {
    return cy.get('mat-radio-button').contains('div', group);
  }

  static getEditBtn(email: string): Cypress.Chainable {
    return this.getTableRow(email).find('button i.km-icon-edit');
  }

  static getDeleteBtn(email: string): Cypress.Chainable {
    return this.getTableRow(email).find('button i.km-icon-delete');
  }

  static getEditMemberDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-edit-member-dialog-edit-btn');
  }

  static getTable(): Cypress.Chainable {
    return cy.get('tbody');
  }

  static getTableRow(email: string): Cypress.Chainable {
    return this.getTableRowEmailColumn(email).parent();
  }

  static getTableRowEmailColumn(email: string): Cypress.Chainable {
    return cy.get('td').contains(email);
  }

  static getTableRowGroupColumn(email: string): Cypress.Chainable {
    return this.getTableRow(email).find('td.mat-column-group');
  }

  static getDeleteMemberDialogDeleteBtn(): Cypress.Chainable {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  // Utils.

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().url(Endpoint.Users).method(RequestType.GET).interceptAndWait();
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Members.Default);
  }

  static visit(): void {
    cy.get('#km-nav-item-members')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static addMember(email: string, group: Group): void {
    this.getAddMemberBtn().should(Condition.NotBe, 'disabled').click();
    this.getAddMemberDialogEmailInput().type(email).should(Condition.HaveValue, email);
    this.getMemberDialogGroup(group).click();
    this.waitForRefresh();
    this.getAddMemberDialogSaveBtn().should(Condition.NotBe, 'disabled').click();
    this.getTable().should(Condition.Contain, email);
  }

  static editMember(email: string, newGroup: Group): void {
    this.getEditBtn(email).click();
    this.getMemberDialogGroup(newGroup).click();
    this.getEditMemberDialogSaveBtn().click();
  }
}
