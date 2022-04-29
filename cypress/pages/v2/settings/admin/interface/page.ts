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

import {AdminSettingsInterfaceStrategy, Condition, Page, PageOptions} from '@kmtypes';
import {Pages} from '@pages/v2';
import {AdminSettingsInterfaceFactory} from './strategy/factory';

export class Interface extends PageOptions implements Page {
  private readonly _strategy: AdminSettingsInterfaceStrategy | undefined;

  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = AdminSettingsInterfaceFactory.new(isAPIMocked);
  }

  visit(): void {
    this.Elements.navItem.click();
  }

  selectEnableKubernetesDashboard(selected: boolean) {
    this.Elements.enableKubernetesDashboardCheckbox.click().then(_ => {
      this._strategy?.onSettingsChange({
        enableDashboard: selected,
      });
      Pages.AdminSettings.Elements.iconCheck.should(Condition.BeVisible);
      Pages.AdminSettings.Elements.iconCheck.should(Condition.NotBeVisible);
    });
  }

  selectEnableOIDCKubeconfig(selected: boolean) {
    this.Elements.enableOIDCCheckbox.click().then(_ => {
      this._strategy?.onSettingsChange({
        enableOIDCKubeconfig: selected,
      });
      Pages.AdminSettings.Elements.iconCheck.should(Condition.BeVisible);
      Pages.AdminSettings.Elements.iconCheck.should(Condition.NotBeVisible);
    });
  }

  selectEnableExternalClusterImport(selected: boolean) {
    this.Elements.enableExternalClustersCheckbox.click().then(_ => {
      this._strategy?.onSettingsChange({
        enableExternalClusterImport: selected,
      });
      Pages.AdminSettings.Elements.iconCheck.should(Condition.BeVisible);
      Pages.AdminSettings.Elements.iconCheck.should(Condition.NotBeVisible);
    });
  }
}

class Elements extends PageOptions {
  private readonly _lastCustomLink = 'km-custom-links-form > form > div > div:last-child';
  private readonly _secondLastCustomLink = 'km-custom-links-form > form > div > div:nth-last-child(2)';

  get lastCustomLinkLabelInput(): Cypress.Chainable {
    return this._get(`${this._lastCustomLink} > mat-form-field:nth-child(1) input`);
  }

  get lastCustomLinkURLInput(): Cypress.Chainable {
    return this._get(`${this._lastCustomLink} > mat-form-field:nth-child(2) input`);
  }

  // It should be used before setting the label and the URL because otherwise the new inputs will be added to form.
  get lastCustomLinkLocationInput(): Cypress.Chainable {
    return this._get(`${this._lastCustomLink} > mat-form-field:nth-child(4)`);
  }

  get secondLastCustomLinkDeleteButton(): Cypress.Chainable {
    return this._get(`${this._secondLastCustomLink} > button`);
  }

  get enableKubernetesDashboardCheckbox(): Cypress.Chainable {
    return this._get('#km-enable-kubernetes-dashboard-setting');
  }

  get enableKubernetesDashboardCheckboxInput(): Cypress.Chainable {
    return this._get('#km-enable-kubernetes-dashboard-setting input');
  }

  get enableOIDCCheckbox(): Cypress.Chainable {
    return this._get('#km-enable-oidc-setting');
  }

  get enableOIDCCheckboxInput(): Cypress.Chainable {
    return this._get('#km-enable-oidc-setting input');
  }

  get enableExternalClustersCheckbox(): Cypress.Chainable {
    return this._get('#km-enable-external-clusters-setting');
  }

  get enableExternalClustersCheckboxInput(): Cypress.Chainable {
    return this._get('#km-enable-external-clusters-setting input');
  }

  get apiDocsCheckbox(): Cypress.Chainable {
    return this._get('#km-api-docs-setting');
  }

  get termsOfServiceCheckbox(): Cypress.Chainable {
    return this._get('#km-tos-setting');
  }

  get demoInfoCheckbox(): Cypress.Chainable {
    return this._get('#km-demo-info-setting');
  }

  get navItem(): Cypress.Chainable {
    return this._get('#km-nav-item-interface');
  }
}
