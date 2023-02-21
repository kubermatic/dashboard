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

import {AdminSettingsDatacentersStrategy, Condition, Datacenter, Page, PageOptions, Provider} from '@kmtypes';
import {AdminSettingsDatacentersFactory} from '@pages/v2/settings/admin/dynamic-datacenters/strategy/factory';
import {Config} from '@utils/config';
import _ from 'lodash';

export class DynamicDatacenters extends PageOptions implements Page {
  private static _dcName: string;
  private readonly _strategy: AdminSettingsDatacentersStrategy | undefined;

  readonly Elements = new Elements();
  readonly Buttons = new Buttons();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = AdminSettingsDatacentersFactory.new(isAPIMocked);
  }

  static getName(): string {
    if (!this._dcName) {
      const prefix = 'a-test-datacenter';
      this._dcName = Config.isAPIMocked() ? prefix : _.uniqueId(`${prefix}-`);
    }

    return this._dcName;
  }

  manageResourcesSideNavItem(): void {
    this.Elements.manageResourcesNavField.click();
  }

  visit(): void {
    this.Elements.navItem.click();
  }

  create(name: string, provider: Provider, seedName: string, country: string, location: Datacenter): void {
    this.Buttons.addDatacenter.click();
    this.Elements.addDatacenterNameInput.type(name);
    this.Elements.selectAddDatacenterProvider(provider);
    this.Elements.selectAddDatacenterSeed(seedName);
    this.Elements.selectAddDatacenterCountry(country);
    this.Elements.addDatacenterLocationInput.type(location);
    this.Buttons.addDatacenterSave.click();
    this.Buttons.addDatacenterSave.should(Condition.NotExist);
  }

  delete(name: string): void {
    this.Buttons.deleteDatacenter(name)
      .should(Condition.Exist)
      .click()
      .then(_ => this._strategy?.onDatacenterDelete());
    this.Buttons.deleteDatacenterConfirm.click();
  }
}

class Buttons extends PageOptions {
  get addDatacenter(): Cypress.Chainable {
    return this._get('#km-admin-settings-add-dc-btn');
  }

  get addDatacenterSave(): Cypress.Chainable {
    return this._get('#km-add-dc-save-btn');
  }

  deleteDatacenter(name: string): Cypress.Chainable {
    return this._get(`#km-datacenter-delete-btn-${name}`);
  }

  get deleteDatacenterConfirm(): Cypress.Chainable {
    return this._get('#km-confirmation-dialog-confirm-btn');
  }
}

class Elements extends PageOptions {
  get addDatacenterNameInput(): Cypress.Chainable {
    return this._get('#km-add-dc-name-input');
  }

  get addDatacenterProviderInput(): Cypress.Chainable {
    return this._get('#km-add-dc-provider-input');
  }

  selectAddDatacenterProvider(provider: Provider): Cypress.Chainable {
    return this.addDatacenterProviderInput
      .click()
      .then(_ => this._get(`mat-option .km-provider-logo-${provider}`).click());
  }

  get addDatacenterSeedInput(): Cypress.Chainable {
    return this._get('#km-add-dc-seed-input');
  }

  selectAddDatacenterSeed(name: string): Cypress.Chainable {
    return this.addDatacenterSeedInput.click().then(_ => this._get('mat-option').contains(name).click());
  }

  get addDatacenterCountryInput(): Cypress.Chainable {
    return this._get('#km-add-dc-country-input');
  }

  selectAddDatacenterCountry(name: string): Cypress.Chainable {
    return this.addDatacenterCountryInput.click().then(_ => this._get('mat-option').contains(name).click());
  }

  get addDatacenterLocationInput(): Cypress.Chainable {
    return this._get('#km-add-dc-location-input');
  }

  get manageResourcesNavField(): Cypress.Chainable {
    return this._get('#km-side-nav-field-Manage-Resources');
  }

  get navItem(): Cypress.Chainable {
    return this._get('#km-nav-item-dc');
  }
}
