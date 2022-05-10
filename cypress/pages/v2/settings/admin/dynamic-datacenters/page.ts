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

import {Datacenter, Page, PageOptions, Provider} from '@kmtypes';
import {Config} from '@utils/config';
import _ from 'lodash';

export class DynamicDatacenters extends PageOptions implements Page {
  private static _dcName: string;

  readonly Elements = new Elements();
  readonly Buttons = new Buttons();

  static getName(): string {
    if (!this._dcName) {
      const prefix = 'test-datacenter';
      this._dcName = Config.isAPIMocked() ? prefix : _.uniqueId(`${prefix}-`);
    }

    return this._dcName;
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

  get navItem(): Cypress.Chainable {
    return this._get('#km-nav-item-dc');
  }
}
