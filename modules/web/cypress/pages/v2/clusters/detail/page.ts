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

import {ClusterDetailStrategy, Condition, Page, PageOptions, Provider} from '@kmtypes';
import {ProviderMenuOption} from '../proxy';
import {ClusterDetailStrategyFactory} from './strategy/factory';

export class ClusterDetail extends PageOptions implements Page {
  private readonly _strategy: ClusterDetailStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = ClusterDetailStrategyFactory.new(isAPIMocked);
  }

  visit(): void {}

  delete(name: string, provider: Provider): void {
    this.Buttons.deleteCluster.click().then(_ => this._strategy?.onDelete(provider));
    this.Elements.deleteDialogInput.type(name);
    this.Buttons.deleteClusterConfirm.click();
    this.Buttons.deleteClusterConfirm.should(Condition.NotExist);
  }

  removeSSHKey(name: string, provider: Provider): void {
    this.Buttons.providerMenu.click();
    this.Buttons.providerMenuOption(ProviderMenuOption.ManageSSHKeys).click();
    this.Buttons.deleteSSHKey(name)
      .click()
      .then(_ => this._strategy?.onSSHKeyDelete(provider));
    this.Buttons.deleteSSHKeyConfirm.click();
    this.Buttons.manageSSHKeyCloseButton.click();
  }
}

class Elements extends PageOptions {
  sshKeys(...names: string[]): Cypress.Chainable {
    if (!names || names.length === 0) {
      names = ['No assigned keys'];
    }

    return this._contains(names.join(', '));
  }

  get machineDeploymentList(): Cypress.Chainable {
    const startTimeout = 600000;
    return this._get('km-machine-deployment-list', startTimeout);
  }

  get deleteDialogInput(): Cypress.Chainable {
    return this._get('#km-delete-cluster-dialog-input');
  }

  get deleteDialogCleanupLBCheckbox(): Cypress.Chainable {
    return this._get('#km-delete-cluster-lb-cleanup');
  }

  get deleteDialogCleanupLBCheckboxInput(): Cypress.Chainable {
    return this._get('#km-delete-cluster-lb-cleanup input');
  }

  get deleteDialogCleanupVolumeCheckbox(): Cypress.Chainable {
    return this._get('#km-delete-cluster-volume-cleanup');
  }

  get deleteDialogCleanupVolumeCheckboxInput(): Cypress.Chainable {
    return this._get('#km-delete-cluster-volume-cleanup input');
  }
}

class Buttons extends PageOptions {
  get providerMenu(): Cypress.Chainable {
    return this._get('.provider-menu-btn');
  }

  providerMenuOption(option: ProviderMenuOption): Cypress.Chainable {
    return this._get('.km-provider-edit-settings').contains('span', option).parent();
  }

  deleteSSHKey(name: string): Cypress.Chainable {
    return this._get(`#km-delete-sshkey-${name}`);
  }

  get deleteSSHKeyConfirm(): Cypress.Chainable {
    return this._get('#km-confirmation-dialog-confirm-btn');
  }

  get manageSSHKeyCloseButton(): Cypress.Chainable {
    return this._get('#km-close-dialog-btn');
  }

  get deleteCluster(): Cypress.Chainable {
    return this._get('#km-delete-cluster-btn');
  }

  get deleteClusterConfirm(): Cypress.Chainable {
    return this._get('#km-delete-cluster-dialog-delete-btn');
  }

  get deleteClusterClose(): Cypress.Chainable {
    return this._get('#km-close-dialog-btn');
  }

  get openKubernetesDashboard(): Cypress.Chainable {
    return this._get('#km-open-kubernetes-dashboard-btn');
  }

  get shareKubeconfig(): Cypress.Chainable {
    return this._get('#km-share-kubeconfig-btn');
  }
}
