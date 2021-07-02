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
import {Preset} from '../utils/preset';
import {View} from '../utils/view';
import {WizardStep} from '../utils/wizard';

class Alibaba {
  static getVSwitchIDInput(): Cypress.Chainable {
    return cy.get('#vSwitchID');
  }
}

class KubeVirt {
  static getNamespaceInput(): Cypress.Chainable {
    return cy.get('#namespace');
  }

  static getSourceURLInput(): Cypress.Chainable {
    return cy.get('#sourceURL');
  }

  static getStorageClassNameInput(): Cypress.Chainable {
    return cy.get('#storageClassName');
  }
}

class DigitalOcean {
  static getNodeSizesCombobox(): Cypress.Chainable {
    return cy.get('#km-digitalocean-node-sizes');
  }

  static getNodeSize(name: string): Cypress.Chainable {
    return cy.get('#km-digitalocean-node-sizes-panel mat-option').contains(name);
  }
}

export class WizardPage {
  // Providers
  static readonly kubeVirt = KubeVirt;
  static readonly alibaba = Alibaba;
  static readonly digitalocean = DigitalOcean;

  static getNextBtn(stepName: WizardStep): Cypress.Chainable {
    return cy.get(`#km-wizard-${stepName}-next-btn`);
  }

  static getClusterNameInput(): Cypress.Chainable {
    return cy.get('#km-wizard-cluster-name-input');
  }

  static getCreateBtn(): Cypress.Chainable {
    return cy.get('#km-wizard-create-btn');
  }

  static getProviderBtn(providerName: string): Cypress.Chainable {
    return cy.get(`.km-provider-logo-${providerName}`);
  }

  static getDatacenterBtn(datacenterName: string): Cypress.Chainable {
    return cy.get('button').contains('.km-location', datacenterName);
  }

  static getCustomPresetsCombobox(): Cypress.Chainable {
    return cy.get('#km-wizard-select-preset');
  }

  static getPreset(preset: Preset): Cypress.Chainable {
    return cy.get('#km-wizard-select-preset-panel').contains('span', preset).parent();
  }

  static getNodeNameInput(): Cypress.Chainable {
    return cy.get('#km-node-name-input');
  }

  static getNodeCountInput(): Cypress.Chainable {
    return cy.get('#km-node-count-input');
  }

  static getSSHKeysSelect(): Cypress.Chainable {
    return cy.get('#keys');
  }

  static getOPAIntegrationCheckbox(): Cypress.Chainable {
    return cy.get('#km-wizard-opa-integration-checkbox');
  }

  static getSSHKeysSelectOption(name: string): Cypress.Chainable {
    return cy.get('#keys-panel').then(option => {
      if (option.find('mat-option').text(name).length > 0) {
        return cy.get('mat-option').contains(name);
      }

      return cy.get('mat-option');
    });
  }

  static getOverlayContainer(): Cypress.Chainable {
    return cy.get('.cdk-overlay-backdrop');
  }

  // Utils

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Wizard.Default);
  }
}
