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

import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {View} from '../../utils/view';
import {AdminSettingsPage} from "../../pages/admin-settings.po";

describe('User Settings Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const linkLocation = 'Footer';
  const linkLabel = 'Google';
  const linkURL = 'https://www.google.com/';
  const waitTime = 3000;

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('should add custom link', () => {
    AdminSettingsPage.getLastCustomLinkLocationInput().click();
    AdminSettingsPage.getLastCustomLinkLocationInput().get('mat-option').contains(linkLocation).click();
    AdminSettingsPage.getLastCustomLinkLabelInput().type(linkLabel).should(Condition.HaveValue, linkLabel);
    AdminSettingsPage.getLastCustomLinkURLInput().type(linkURL).should(Condition.HaveValue, linkURL);
  });

  it('should make sure that API documentation display is enabled', () => {
    AdminSettingsPage.getApiDocsCheckbox().click();
    AdminSettingsPage.getApiDocsCheckbox().should(Condition.BeChecked);
  })

  it('should make sure that terms of service display is enabled', () => {
    AdminSettingsPage.getTermsOfServiceCheckbox().click();
    AdminSettingsPage.getTermsOfServiceCheckbox().should(Condition.BeChecked);
  })

  it('should make sure that demo information display is enabled', () => {
    AdminSettingsPage.getDemoInfoCheckbox().click();
    AdminSettingsPage.getDemoInfoCheckbox().should(Condition.BeChecked);
  })

  it('should wait for a few seconds for settings to apply', () => {
    cy.wait(waitTime);
  })

  it('should check if footer contains custom link', () => {

  })

  it('should check if help panel contains API docs', () => {

  })

  it('should check if footer contains terms of service', () => {

  })

  it('should check if footer contains demo information', () => {

  })

  it('should delete custom link', () => {

  })

  it('should make sure that API documentation display is disabled', () => {
    AdminSettingsPage.getApiDocsCheckbox().click();
    AdminSettingsPage.getApiDocsCheckbox().should(Condition.NotBeChecked);
  })

  it('should make sure that terms of service display is disabled', () => {
    AdminSettingsPage.getTermsOfServiceCheckbox().click();
    AdminSettingsPage.getTermsOfServiceCheckbox().should(Condition.NotBeChecked);
  })

  it('should make sure that demo information display is disabled', () => {
    AdminSettingsPage.getDemoInfoCheckbox().click();
    AdminSettingsPage.getDemoInfoCheckbox().should(Condition.NotBeChecked);
  })

  it('should check if footer does not contain custom link', () => {

  })

  it('should check if help panel contains API docs', () => {

  })

  it('should check if footer contains terms of service', () => {

  })

  it('should check if footer contains demo information', () => {

  })

  it('should logout', () => {
    logout();
  });
});
