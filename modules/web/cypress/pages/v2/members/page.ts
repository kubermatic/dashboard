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

import {Group, MembersStrategy, Page, PageOptions} from '@kmtypes';
import {MembersStrategyFactory} from './strategy/factory';

export class Members extends PageOptions implements Page {
  private readonly _strategy: MembersStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = MembersStrategyFactory.new(isAPIMocked);
  }

  visit(): void {
    this.Elements.navButton.click();
  }

  add(email: string, group: Group): void {
    this.Buttons.openDialog.click();
    this.Elements.addDialogEmailInput.type(email);
    this.Elements.addDialogGroupSelect(group).click();
    this.Buttons.addDialogConfirm.click().then(_ => this._strategy?.onCreate());
  }

  delete(email: string): void {
    this.Buttons.deleteDialog(email).click();
    this.Buttons.deleteDialogConfirm.click().then(_ => this._strategy?.onDelete());
  }
}

class Elements extends PageOptions {
  get navButton(): Cypress.Chainable {
    return this._get('#km-nav-item-members');
  }

  get addDialogEmailInput(): Cypress.Chainable {
    return this._get('#km-add-member-dialog-email-input');
  }

  addDialogGroupSelect(group: Group): Cypress.Chainable {
    return this._get('mat-radio-button').contains('div', group);
  }
}

class Buttons extends PageOptions {
  get addDialogConfirm(): Cypress.Chainable {
    return this._get('#km-add-member-dialog-add-btn');
  }

  get deleteDialogConfirm(): Cypress.Chainable {
    return this._get('#km-confirmation-dialog-confirm-btn');
  }

  get openDialog(): Cypress.Chainable {
    return this._get('#km-add-member-top-btn');
  }

  get table(): Cypress.Chainable {
    return this._get('tbody');
  }

  deleteDialog(email: string): Cypress.Chainable {
    return this._get(`#km-delete-member-${CSS.escape(email)}`);
  }

  tableRow(name: string): Cypress.Chainable {
    return this._contains(name);
  }
}
