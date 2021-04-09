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

  static getFooter(): Cypress.Chainable {
    return cy.get('.km-footer');
  }

  static getFooterCustomIcon(url: string): Cypress.Chainable {
    return cy.get(`.km-footer a[href="${url}"]`);
  }

  // Utils.

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
