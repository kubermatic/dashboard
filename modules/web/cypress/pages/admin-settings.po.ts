// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Condition} from '../utils/condition';
import {Config} from '../utils/config';
import {Endpoint} from '../utils/endpoint';
import {Mocks} from '../utils/mocks';
import {RequestType, ResponseCheck, ResponseType, TrafficMonitor} from '../utils/monitor';
import {Provider} from '../utils/provider';
import {View} from '../utils/view';
import {UserPanel} from './user-panel.po';

class AdministratorsPage {
  getAddAdminBtn(): Cypress.Chainable {
    return cy.get('#km-add-admin-btn');
  }

  getAddAdminDialogEmailInput(): Cypress.Chainable {
    return cy.get('#km-add-admin-dialog-email-input');
  }

  getAddAdminDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-add-admin-dialog-save-btn');
  }

  getDeleteAdminBtn(email: string): Cypress.Chainable {
    return cy.get(`#km-admin-delete-${btoa(email)}`);
  }

  getNavItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-administrators');
  }

  verifyUrl(): void {
    cy.url().should(Condition.Include, View.AdminSettings.Administrators);
  }

  visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.getNavItem().click())
      .then(() => this.verifyUrl());
  }

  addAdmin(email: string): void {
    if (Mocks.enabled()) {
      switch (email) {
        case Config.adminEmail():
          Mocks.administrators.push(Mocks.defaultAdmin);
          break;
        case Config.userEmail():
          Mocks.administrators.push(Mocks.secondAdmin);
          break;
      }
    } else {
      AdminSettings.AdministratorsPage.getAddAdminBtn().click();
      AdminSettings.AdministratorsPage.getAddAdminDialogEmailInput().type(email).should(Condition.HaveValue, email);
      AdminSettings.AdministratorsPage.getAddAdminDialogSaveBtn().click();
    }
  }

  verifyAdminCount(count: number): void {
    const retries = 15;
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Administrators)
      .retry(retries)
      .expect(new ResponseCheck(ResponseType.LIST).elements(count));
  }
}

class InterfacePage {
  private _lastCustomLink = 'km-custom-links-form > form > div > div:last-child';
  private _secondLastCustomLink = 'km-custom-links-form > form > div > div:nth-last-child(2)';

  getLastCustomLinkLabelInput(): Cypress.Chainable {
    return cy.get(`${this._lastCustomLink} > mat-form-field:nth-child(1) input`);
  }

  getLastCustomLinkURLInput(): Cypress.Chainable {
    return cy.get(`${this._lastCustomLink} > mat-form-field:nth-child(2) input`);
  }

  // It should be used before setting the label and the URL because otherwise the new inputs will be added to form.
  getLastCustomLinkLocationInput(): Cypress.Chainable {
    return cy.get(`${this._lastCustomLink} > mat-form-field:nth-child(4)`);
  }

  getSecondLastCustomLinkDeleteButton(): Cypress.Chainable {
    return cy.get(`${this._secondLastCustomLink} > button`);
  }

  getEnableKubernetesDashboardCheckbox(): Cypress.Chainable {
    return cy.get('#km-enable-kubernetes-dashboard-setting');
  }

  getEnableOIDCCheckbox(): Cypress.Chainable {
    return cy.get('#km-enable-oidc-setting');
  }

  getEnableExternalClustersCheckbox(): Cypress.Chainable {
    return cy.get('#km-enable-external-clusters-setting');
  }

  getApiDocsCheckbox(): Cypress.Chainable {
    return cy.get('#km-api-docs-setting');
  }

  getTermsOfServiceCheckbox(): Cypress.Chainable {
    return cy.get('#km-tos-setting');
  }

  getDemoInfoCheckbox(): Cypress.Chainable {
    return cy.get('#km-demo-info-setting');
  }

  getNavItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-interface');
  }

  verifyUrl(): void {
    cy.url().should(Condition.Include, View.AdminSettings.Interface);
  }

  visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.getNavItem().click())
      .then(() => this.verifyUrl());
  }
}

class DefaultsAndLimitsPage {
  getOPAEnableCheckbox(): Cypress.Chainable {
    return cy.get('#km-opa-enable-setting');
  }

  getOPAEnforceCheckbox(): Cypress.Chainable {
    return cy.get('#km-opa-enforce-setting');
  }

  getInitialReplicasInput(): Cypress.Chainable {
    return cy.get('#km-initial-replicas-setting');
  }

  getMinCPUResourceQuotaInput(): Cypress.Chainable {
    return cy.get('#km-cpu-resource-quota-setting');
  }

  getMinRAMResourceQuotaInput(): Cypress.Chainable {
    return cy.get('#km-ram-resource-quota-setting');
  }

  getRestrictProjectCreationToAdminsCheckbox(): Cypress.Chainable {
    return cy.get('#km-project-admin-only-setting');
  }

  getProjectLimitInput(): Cypress.Chainable {
    return cy.get('#km-project-limit-setting');
  }

  getCleanupEnableCheckbox(): Cypress.Chainable {
    return cy.get('#km-cleanup-enable-setting');
  }

  getCleanupEnforceCheckbox(): Cypress.Chainable {
    return cy.get('#km-cleanup-enforce-setting');
  }

  getNavItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-defaults');
  }

  verifyUrl(): void {
    cy.url().should(Condition.Include, View.AdminSettings.DefaultsAndLimits);
  }

  visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.getNavItem().click())
      .then(() => this.verifyUrl());
  }
}

class DynamicDatacentersPage {
  getAddDatacenterBtn(): Cypress.Chainable {
    return cy.get('#km-admin-settings-add-dc-btn');
  }

  getAddDatacenterNameInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-name-input');
  }

  getAddDatacenterProviderInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-provider-input');
  }

  getAddDatacenterSeedInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-seed-input');
  }

  getAddDatacenterCountryInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-country-input');
  }

  getAddDatacenterLocationInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-location-input');
  }

  getAddDatacenterSaveBtn(): Cypress.Chainable {
    return cy.get('#km-add-dc-save-btn');
  }

  getDeleteDatacenterBtn(name: string): Cypress.Chainable {
    return cy.get(`#km-datacenter-delete-btn-${name}`);
  }

  getNavItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-dc');
  }

  verifyUrl(): void {
    cy.url().should(Condition.Include, View.AdminSettings.DynamicDatacenters);
  }

  visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.getNavItem().click())
      .then(() => this.verifyUrl());
  }
}

class ProviderPresetsPage {
  getAddPresetBtn(): Cypress.Chainable {
    return cy.get('#km-add-preset-btn');
  }

  getAddPresetDialogNameInput(): Cypress.Chainable {
    return cy.get('#km-settings-preset-name-input');
  }

  getAddPresetDialogNextBtn(): Cypress.Chainable {
    return cy.get('#km-settings-preset-next-btn');
  }

  getAddPresetDialogCreateBtn(): Cypress.Chainable {
    return cy.get('#km-settings-preset-create-btn');
  }

  getAddPresetDialogProviderBtn(provider: Provider): Cypress.Chainable {
    return cy
      .get('#km-settings-preset-dialog-provider-' + provider)
      .parent()
      .parent();
  }

  getAddPresetDialogDigitaloceanTokenInput(): Cypress.Chainable {
    return cy.get('#km-settings-preset-digitalocean-token');
  }

  // Utils.
  getNavItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-presets');
  }

  verifyUrl(): void {
    cy.url().should(Condition.Include, View.AdminSettings.ProviderPresets);
  }

  visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.getNavItem().click())
      .then(() => this.verifyUrl());
  }
}

class OPAPage {
  getAddConstraintTemplateBtn(): Cypress.Chainable {
    return cy.get('#km-add-constraint-template-btn');
  }

  getAddConstraintTemplateSpecTextarea(): Cypress.Chainable {
    return cy.get('.monaco-editor textarea:first');
  }

  getConstraintTemplateDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-constraint-template-dialog-btn');
  }

  getDeleteConstraintTemplateBtn(name: string): Cypress.Chainable {
    return cy.get(`#km-constraint-template-delete-btn-${name}`);
  }

  getConstraintTemplatesTable(): Cypress.Chainable {
    return cy.get('km-constraint-templates-list tbody');
  }

  getNavItem(): Cypress.Chainable {
    return cy.get('#km-nav-item-opa');
  }

  getTabCard(title: string): Cypress.Chainable {
    return cy.get('#km-admin-opa-card').find('div.mdc-tab__content').contains(title);
  }

  verifyUrl(): void {
    cy.url().should(Condition.Include, View.AdminSettings.OPA);
  }

  visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.getNavItem().click())
      .then(() => this.verifyUrl());
  }
}

export class AdminSettings {
  static readonly AdministratorsPage = new AdministratorsPage();
  static readonly InterfacePage = new InterfacePage();
  static readonly DefaultsAndLimitsPage = new DefaultsAndLimitsPage();
  static readonly DynamicDatacentersPage = new DynamicDatacentersPage();
  static readonly ProviderPresetsPage = new ProviderPresetsPage();
  static readonly OPAPage = new OPAPage();

  static getFooter(): Cypress.Chainable {
    return cy.get('.km-footer');
  }

  static getFooterCustomIcon(url: string): Cypress.Chainable {
    return cy.get(`.km-footer a[href="${url}"]`);
  }

  // Utils.
  static waitForSave(): void {
    TrafficMonitor.newTrafficMonitor().url(Endpoint.AdminSettings).method(RequestType.PATCH).interceptAndWait();
  }
}
