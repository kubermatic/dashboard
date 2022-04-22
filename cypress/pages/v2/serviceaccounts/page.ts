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

import {Group} from '@ctypes/member';
import {Page, PageOptions, ServiceAccountStrategy, ServiceAccountTokenStrategy} from '@ctypes/pages';
import {ServiceAccountStrategyFactory, ServiceAccountTokenStrategyFactory} from './strategy/factory';

export class ServiceAccounts extends PageOptions implements Page {
  private readonly _strategy: ServiceAccountStrategy | undefined;
  private readonly _tokenStrategy: ServiceAccountTokenStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = ServiceAccountStrategyFactory.new(isAPIMocked);
    this._tokenStrategy = ServiceAccountTokenStrategyFactory.new(isAPIMocked);
  }

  static getName(): string {
    return 'test-sa';
  }

  static getTokenName(): string {
    return 'test-token';
  }

  visit(): void {
    this.Buttons.nav.click();
  }

  create(name: string, group: Group): void {
    this.Buttons.openDialog.click();
    this.Elements.createDialogNameInput.type(name);
    this.Elements.createDialogGroupSelect(group).click();
    this.Buttons.createDialogConfirm.click().then(_ => this._strategy?.onCreate());
  }

  delete(name: string): void {
    this.Buttons.deleteDialog(name).click();
    this.Buttons.deleteDialogConfirm.click().then(_ => this._strategy?.onDelete());
  }

  addToken(name: string): void {
    this.Buttons.openTokenDialog.click({force: true});
    this.Elements.addTokenDialogNameInput.type(name);
    this.Buttons.addToken.click();
    this.Buttons.gotIt.click().then(_ => this._tokenStrategy?.onCreate());
  }
}

class Elements extends PageOptions {
  get createDialogNameInput(): Cypress.Chainable {
    return this._get('#km-create-serviceaccount-dialog-name-input');
  }

  get addTokenDialogNameInput(): Cypress.Chainable {
    return this._get('#km-serviceaccount-token-dialog-name-input');
  }

  createDialogGroupSelect(group: Group): Cypress.Chainable {
    return this._get('mat-radio-button').contains('div', group);
  }
}

class Buttons extends PageOptions {
  get nav(): Cypress.Chainable {
    return this._get('#km-nav-item-service-accounts');
  }

  get addToken(): Cypress.Chainable {
    return this._get('#km-serviceaccount-token-dialog-update-btn');
  }

  get gotIt(): Cypress.Chainable {
    return this._get('#km-serviceaccount-token-dialog-confirm-btn');
  }

  get openTokenDialog(): Cypress.Chainable {
    return this._get('#km-add-serviceaccount-token');
  }

  get createDialogConfirm(): Cypress.Chainable {
    return this._get('#km-create-serviceaccount-dialog-create-btn');
  }

  get deleteDialogConfirm(): Cypress.Chainable {
    return this._get('#km-confirmation-dialog-confirm-btn');
  }

  get openDialog(): Cypress.Chainable {
    return this._get('#km-create-serviceaccount-top-btn');
  }

  get table(): Cypress.Chainable {
    return this._get('tbody');
  }

  get tokenTable(): Cypress.Chainable {
    return this._get('km-serviceaccount-token');
  }

  deleteDialog(name: string): Cypress.Chainable {
    return this._get(`#km-delete-serviceaccount-${CSS.escape(name)}`);
  }

  tableRow(name: string): Cypress.Chainable {
    return this._contains(name);
  }

  tokenTableRow(name: string): Cypress.Chainable {
    return this._contains(name);
  }
}
