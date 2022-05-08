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

import {Page, PageOptions, SSHKeyStrategy} from '@kmtypes';
import {SSHKeyStrategyFactory} from './strategy/factory';

export class SSHKeys extends PageOptions implements Page {
  private readonly _strategy: SSHKeyStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = SSHKeyStrategyFactory.new(isAPIMocked);
  }

  static getName(): string {
    return 'test-ssh-key';
  }

  static get publicKey(): string {
    return (
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCo/3xm3JmJ7rp7I6GNYvjySYlWIGe75Oyr/u2cv5Fv2vsqfsiAP2xvIrJKxQ3+LwZAo0JnTvNQ' +
      'bVKo+G6pV1HEXhRlPuLuKWtkKCJue0wJXnIUz3dSniQDSIovjM+j5FUQauE3KeVgII2SQ7vVIKJcpFNVoA6cUjCeV8S9IHndOERzbBMhFe2sI3Ej' +
      'HSYSw2PCyXrUvDWBFjeUEV9jr3TJHLs7ea0bXJj+SA5o4nw/XOCqnoJsnBZa+I3KIAiHgV779R3XGlWZ1aD0ow4y3UzXy2U+aKKPBEoXFmKAKezt' +
      'vopqZemjIGzQT8Bgu1inXcwMfo3sB5bYMDnnP3Wyn/gz'
    );
  }

  visit(): void {
    this.Buttons.nav.click();
  }

  create(name: string, publicKey: string): void {
    this.Buttons.createDialog.click().then(_ => this._strategy?.onCreate());
    this.Elements.createDialogInput.type(name);
    this.Elements.createDialogTextarea.type(publicKey);
    this.Buttons.creatDialogConfirm.click();
  }

  delete(name: string): void {
    this.Buttons.deleteSSHKey(name)
      .click({force: true})
      .then(_ => this._strategy?.onDelete());
    this.Buttons.deleteSSHKeyConfirm.click();
  }
}

class Elements extends PageOptions {
  sshKey(name: string): Cypress.Chainable {
    return this._contains(name);
  }

  get createDialogInput(): Cypress.Chainable {
    return this._get('#name');
  }

  get createDialogTextarea(): Cypress.Chainable {
    return this._get('#key');
  }
}

class Buttons extends PageOptions {
  get nav(): Cypress.Chainable {
    return this._get('#km-nav-item-sshkeys');
  }

  get createDialog(): Cypress.Chainable {
    return this._get('#km-add-ssh-key-top-btn');
  }

  get creatDialogConfirm(): Cypress.Chainable {
    return this._get('#km-add-ssh-key-dialog-save');
  }

  tableRow(name: string): Cypress.Chainable {
    return this._contains(name);
  }

  deleteSSHKey(name: string): Cypress.Chainable {
    return this._get(`#km-delete-sshkey-${name}`);
  }

  get deleteSSHKeyConfirm(): Cypress.Chainable {
    return this._get('#km-confirmation-dialog-confirm-btn');
  }
}
