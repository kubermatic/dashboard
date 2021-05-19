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
import {Endpoint} from '../utils/endpoint';
import {RequestType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';
import {UserPanel} from './user-panel.po';

export class AdminSettingsPage {
  private static lastCustomLink = 'km-custom-links-form > form > div > div:last-child';
  private static secondLastCustomLink = 'km-custom-links-form > form > div > div:nth-last-child(2)';

  static getLastCustomLinkLabelInput(): Cypress.Chainable {
    return cy.get(`${AdminSettingsPage.lastCustomLink} > mat-form-field:nth-child(1) input`);
  }

  static getLastCustomLinkURLInput(): Cypress.Chainable {
    return cy.get(`${AdminSettingsPage.lastCustomLink} > mat-form-field:nth-child(2) input`);
  }

  // It should be used before setting the label and the URL because otherwise the new inputs will be added to form.
  static getLastCustomLinkLocationInput(): Cypress.Chainable {
    return cy.get(`${AdminSettingsPage.lastCustomLink} > mat-form-field:nth-child(4)`);
  }

  static getSecondLastCustomLinkDeleteButton(): Cypress.Chainable {
    return cy.get(`${AdminSettingsPage.secondLastCustomLink} > button`);
  }

  static getApiDocsCheckbox(): Cypress.Chainable {
    return cy.get('#km-api-docs-setting');
  }

  static getTermsOfServiceCheckbox(): Cypress.Chainable {
    return cy.get('#km-tos-setting');
  }

  static getDemoInfoCheckbox(): Cypress.Chainable {
    return cy.get('#km-demo-info-setting');
  }

  static getOPAEnableCheckbox(): Cypress.Chainable {
    return cy.get('#km-opa-enable-setting');
  }

  static getOPAEnforceCheckbox(): Cypress.Chainable {
    return cy.get('#km-opa-enforce-setting');
  }

  static getInitialReplicasInput(): Cypress.Chainable {
    return cy.get('#km-initial-replicas-setting');
  }

  static getMinCPUResourceQuotaInput(): Cypress.Chainable {
    return cy.get('#km-cpu-resource-quota-setting');
  }

  static getMinRAMResourceQuotaInput(): Cypress.Chainable {
    return cy.get('#km-ram-resource-quota-setting');
  }

  static getRestrictProjectCreationToAdminsCheckbox(): Cypress.Chainable {
    return cy.get('#km-project-admin-only-setting');
  }

  static getProjectLimitInput(): Cypress.Chainable {
    return cy.get('#km-project-limit-setting');
  }

  static getCleanupEnableCheckbox(): Cypress.Chainable {
    return cy.get('#km-cleanup-enable-setting');
  }

  static getCleanupEnforceCheckbox(): Cypress.Chainable {
    return cy.get('#km-cleanup-enforce-setting');
  }

  static getEnableKubernetesDashboardCheckbox(): Cypress.Chainable {
    return cy.get('#km-enable-kubernetes-dashboard-setting');
  }

  static getEnableOIDCCheckbox(): Cypress.Chainable {
    return cy.get('#km-enable-oidc-setting');
  }

  static getEnableExternalClustersCheckbox(): Cypress.Chainable {
    return cy.get('#km-enable-external-clusters-setting');
  }

  static getFooter(): Cypress.Chainable {
    return cy.get('.km-footer');
  }

  static getFooterCustomIcon(url: string): Cypress.Chainable {
    return cy.get(`.km-footer a[href="${url}"]`);
  }

  static getDynamicDatacentersTab(): Cypress.Chainable {
    return cy.get('#mat-tab-label-0-0');
  }

  static getAddDatacenterBtn(): Cypress.Chainable {
    return cy.get('#km-admin-settings-add-dc-btn');
  }

  static getAddDatacenterNameInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-name-input');
  }

  static getAddDatacenterProviderInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-provider-input');
  }

  static getAddDatacenterSeedInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-seed-input');
  }

  static getAddDatacenterCountryInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-country-input');
  }

  static getAddDatacenterLocationInput(): Cypress.Chainable {
    return cy.get('#km-add-dc-location-input');
  }

  static getAddDatacenterSaveBtn(): Cypress.Chainable {
    return cy.get('#km-add-dc-save-btn');
  }

  static getAdminsTab(): Cypress.Chainable {
    return cy.get('#mat-tab-label-0-1');
  }

  static getAddAdminBtn(): Cypress.Chainable {
    return cy.get('#km-add-admin-btn');
  }

  static getAddAdminDialogEmailInput(): Cypress.Chainable {
    return cy.get('#km-add-admin-dialog-email-input');
  }

  static getAddAdminDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-add-admin-dialog-save-btn');
  }

  static getDeleteAdminBtn(email: string): Cypress.Chainable {
    return cy.get(`#km-admin-delete-${btoa(email)}`);
  }

  // Utils.

  static waitForSave(): void {
    TrafficMonitor.newTrafficMonitor().url(Endpoint.AdminSettings).method(RequestType.PATCH).interceptAndWait();
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Admin);
  }

  static visit(): void {
    UserPanel.open();
    UserPanel.getAdminSettingsBtn()
      .click()
      .then(() => this.verifyUrl());
  }
}
