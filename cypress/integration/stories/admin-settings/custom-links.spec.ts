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

import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {View} from '../../../utils/view';
import {AdminSettingsPage} from '../../../pages/admin-settings.po';
import {HelpPanel} from '../../../pages/help-panel.po';

describe('Admin Settings - Custom Links Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const linkLocation = 'Footer';
  const linkLabel = 'Google';
  const linkURL = 'https://www.google.com/';
  const demoInfo = 'Demo system';
  const termsOfService = 'Terms of Service';

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
    AdminSettingsPage.getApiDocsCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should make sure that terms of service display is enabled', () => {
    AdminSettingsPage.getTermsOfServiceCheckbox().click();
    AdminSettingsPage.getTermsOfServiceCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should make sure that demo information display is enabled', () => {
    AdminSettingsPage.getDemoInfoCheckbox().click();
    AdminSettingsPage.getDemoInfoCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should check if footer contains custom link', () => {
    AdminSettingsPage.getFooterCustomIcon(linkURL).should(Condition.Exist);
  });

  it('should check if help panel contains API docs', () => {
    HelpPanel.open();
    HelpPanel.getAPIDocsBtn().should(Condition.Exist);
  });

  it('should check if footer contains terms of service', () => {
    AdminSettingsPage.getFooter().should(Condition.Contain, termsOfService);
  });

  it('should check if footer contains demo information', () => {
    AdminSettingsPage.getFooter().should(Condition.Contain, demoInfo);
  });

  it('should delete custom link', () => {
    AdminSettingsPage.getSecondLastCustomLinkDeleteButton().should(Condition.NotBe, 'disabled').click();
  });

  it('should make sure that API documentation display is disabled', () => {
    AdminSettingsPage.getApiDocsCheckbox().click();
    AdminSettingsPage.getApiDocsCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should make sure that terms of service display is disabled', () => {
    AdminSettingsPage.getTermsOfServiceCheckbox().click();
    AdminSettingsPage.getTermsOfServiceCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should make sure that demo information display is disabled', () => {
    AdminSettingsPage.getDemoInfoCheckbox().click();
    AdminSettingsPage.getDemoInfoCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should check if footer does not contain custom link', () => {
    AdminSettingsPage.getFooterCustomIcon(linkURL).should(Condition.NotExist);
  });

  it('should check if footer does not contain terms of service', () => {
    AdminSettingsPage.getFooter().should(Condition.NotContain, termsOfService);
  });

  it('should check if footer does not contain demo information', () => {
    AdminSettingsPage.getFooter().should(Condition.NotContain, demoInfo);
  });

  it('should logout', () => {
    logout();
  });
});
