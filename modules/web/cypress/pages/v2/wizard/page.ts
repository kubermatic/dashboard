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

import {Datacenter, Page, PageOptions, Provider, WizardStep, WizardStrategy} from '@kmtypes';
import {Condition} from '@utils/condition';
import {WizardStrategyFactory} from './strategy/factory';

export class Wizard extends PageOptions implements Page {
  private readonly _strategy: WizardStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = WizardStrategyFactory.new(isAPIMocked);
  }

  visit(): void {
    this.Buttons.open.click();
  }

  create(
    name: string,
    provider: Provider,
    datacenter: Datacenter,
    presetName?: string,
    mdName?: string,
    replicas?: string,
    sshKeyName?: string
  ): void {
    if (provider !== Provider.kubeadm && !presetName) {
      throw new Error(`Preset has to be defined for the ${provider} provider.`);
    }

    this.Buttons.provider(provider).click();
    this.Buttons.datacenter(datacenter)
      .click()
      .then(_ => this._strategy?.onCreate(provider));
    this.Elements.clusterNameInput.type(name).should(Condition.HaveValue, name);

    if (sshKeyName) {
      this.Buttons.sshKeysSelect.click();
      this.Buttons.sshKeysSelectOption(sshKeyName)
        .click()
        .then(_ => this._strategy?.onSSHKeyAdd(provider));
      this.Buttons.overlayContainer.click({force: true});
    }

    this.Buttons.nextStep(WizardStep.Cluster).click({multiple: true});

    // kubeadm does not have additional steps
    if (provider === Provider.kubeadm) {
      this.Buttons.nextStep(WizardStep.Applications).click();
      this.Buttons.create.click({force: true});
      return;
    }

    this.Buttons.presetSelect.click();
    this.Buttons.presetSelectOption(presetName!).click();
    this.Buttons.nextStep(WizardStep.ProviderSettings).click();

    if (mdName) {
      this.Elements.nodeNameInput.type(mdName).should(Condition.HaveValue, mdName);
    }

    if (replicas) {
      this.Elements.nodeCountInput.clear().type(replicas).should(Condition.HaveValue, replicas);
    }

    this.Buttons.nextStep(WizardStep.NodeSettings).click();
    this.Buttons.nextStep(WizardStep.Applications).click();
    this.Buttons.create.click({force: true});
  }
}

class Elements extends PageOptions {
  get clusterNameInput(): Cypress.Chainable {
    return this._get('#km-wizard-cluster-name-input');
  }

  get nodeNameInput(): Cypress.Chainable {
    return this._get('#km-node-name-input');
  }

  get nodeCountInput(): Cypress.Chainable {
    return this._get('#km-node-count-input');
  }
}

class Buttons extends PageOptions {
  get open(): Cypress.Chainable {
    return this._get('#km-add-cluster-top-btn');
  }

  provider(name: Provider): Cypress.Chainable {
    return this._get(`.km-provider-logo-${name}`);
  }

  datacenter(name: Datacenter): Cypress.Chainable {
    return this._get('button').contains('.location', name);
  }

  get sshKeysSelect(): Cypress.Chainable {
    return this._get('#keys');
  }

  sshKeysSelectOption(name: string): Cypress.Chainable {
    return this._get('#keys-panel').then(option => {
      if (option.find('mat-option').text(name).length > 0) {
        return this._get('mat-option').contains(name);
      }

      return this._get('mat-option');
    });
  }

  get presetSelect(): Cypress.Chainable {
    return this._get('#km-wizard-select-preset');
  }

  presetSelectOption(name: string): Cypress.Chainable {
    return this._get('#km-wizard-select-preset-panel').then(option => {
      if (option.find('mat-option').text(name).length > 0) {
        return this._get('mat-option').contains(name);
      }

      return this._get('mat-option');
    });
  }

  get overlayContainer(): Cypress.Chainable {
    return this._get('.cdk-overlay-backdrop');
  }

  nextStep(name: WizardStep): Cypress.Chainable {
    return this._get(`#km-wizard-${name}-next-btn`);
  }

  get create(): Cypress.Chainable {
    return this._get('#km-wizard-create-btn');
  }
}
