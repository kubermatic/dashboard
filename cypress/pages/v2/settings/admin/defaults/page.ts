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

import {AdminSettingsDefaultsStrategy, Page, PageOptions} from '@kmtypes';
import {AdminSettingsDefaultsFactory} from '@pages/v2/settings/admin/defaults/strategy/factory';

export class Defaults extends PageOptions implements Page {
  private readonly _strategy: AdminSettingsDefaultsStrategy | undefined;

  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = AdminSettingsDefaultsFactory.new(isAPIMocked);
  }

  visit(): void {
    this.Elements.navItem.click();
  }

  selectClusterCleanup(enabled: boolean, enforced: boolean): void {
    this.Elements.enableClusterCleanupCheckbox.click();
    this.Elements.enforceClusterCleanupCheckbox.click().then(_ =>
      this._strategy?.onSettingsChange({
        cleanupOptions: {
          enabled,
          enforced,
        },
      })
    );
  }
}

class Elements extends PageOptions {
  get enableClusterCleanupCheckbox(): Cypress.Chainable {
    return cy.get('#km-cleanup-enable-setting');
  }

  get enableClusterCleanupCheckboxInput(): Cypress.Chainable {
    return cy.get('#km-cleanup-enable-setting input');
  }

  get enforceClusterCleanupCheckbox(): Cypress.Chainable {
    return cy.get('#km-cleanup-enforce-setting');
  }

  get enforceClusterCleanupCheckboxInput(): Cypress.Chainable {
    return cy.get('#km-cleanup-enforce-setting input');
  }

  get opaEnableCheckbox(): Cypress.Chainable {
    return cy.get('#km-opa-enable-setting');
  }

  get opaEnforceCheckbox(): Cypress.Chainable {
    return cy.get('#km-opa-enforce-setting');
  }

  get initialReplicasInput(): Cypress.Chainable {
    return cy.get('#km-initial-replicas-setting');
  }

  get minCPUResourceQuotaInput(): Cypress.Chainable {
    return cy.get('#km-cpu-resource-quota-setting');
  }

  get minRAMResourceQuotaInput(): Cypress.Chainable {
    return cy.get('#km-ram-resource-quota-setting');
  }

  get restrictProjectCreationToAdminsCheckbox(): Cypress.Chainable {
    return cy.get('#km-project-admin-only-setting');
  }

  get projectLimitInput(): Cypress.Chainable {
    return cy.get('#km-project-limit-setting');
  }

  get navItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-defaults');
  }
}
