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

import {AdminSettings} from '../../../pages/admin-settings.po';
import {HelpPanel} from '../../../pages/help-panel.po';
import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {Config} from '../../../utils/config';
import {Mocks} from '../../../utils/mocks';
import {View} from '../../../utils/view';

describe('Admin Settings - Custom Links Story', () => {
  const linkLocation = 'Footer';
  const linkLabel = 'Google';
  const linkURL = 'https://www.google.com/';
  const demoInfo = 'Demo system';
  const termsOfService = 'Terms of Service';

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - interface page', () => {
    AdminSettings.InterfacePage.visit();
  });

  it('should add custom link', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.customLinks.push({
        label: linkLabel,
        url: linkURL,
        icon: '',
        location: linkLocation.toLowerCase(),
      });
    } else {
      AdminSettings.InterfacePage.getLastCustomLinkLocationInput().click();
      AdminSettings.InterfacePage.getLastCustomLinkLocationInput().get('mat-option').contains(linkLocation).click();
      AdminSettings.InterfacePage.getLastCustomLinkLabelInput().type(linkLabel).should(Condition.HaveValue, linkLabel);
      AdminSettings.InterfacePage.getLastCustomLinkURLInput().type(linkURL).should(Condition.HaveValue, linkURL);
      AdminSettings.waitForSave();
    }
  });

  it('should enable API documentation checkbox', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.displayAPIDocs = true;
    } else {
      AdminSettings.InterfacePage.getApiDocsCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that API documentation display is enabled', () => {
    AdminSettings.InterfacePage.getApiDocsCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should enable terms of service checkbox', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.displayTermsOfService = true;
    } else {
      AdminSettings.InterfacePage.getTermsOfServiceCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that terms of service display is enabled', () => {
    AdminSettings.InterfacePage.getTermsOfServiceCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should enable demo information checkbox', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.displayDemoInfo = true;
    } else {
      AdminSettings.InterfacePage.getDemoInfoCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that demo information display is enabled', () => {
    AdminSettings.InterfacePage.getDemoInfoCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should check if footer contains custom link', () => {
    AdminSettings.getFooterCustomIcon(linkURL).should(Condition.Exist);
  });

  it('should check if help panel contains API docs', () => {
    HelpPanel.open();
    HelpPanel.getAPIDocsBtn().should(Condition.Exist);
  });

  it('should check if footer contains terms of service', () => {
    AdminSettings.getFooter().should(Condition.Contain, termsOfService);
  });

  it('should check if footer contains demo information', () => {
    AdminSettings.getFooter().should(Condition.Contain, demoInfo);
  });

  it('should delete custom link', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.customLinks = [];
    } else {
      AdminSettings.InterfacePage.getSecondLastCustomLinkDeleteButton().should(Condition.NotBe, 'disabled').click();
      AdminSettings.waitForSave();
    }
  });

  it('should disable API documentation checkbox', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.displayAPIDocs = false;
    } else {
      AdminSettings.InterfacePage.getApiDocsCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that API documentation display is disabled', () => {
    AdminSettings.InterfacePage.getApiDocsCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should disable terms of service checkbox', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.displayTermsOfService = false;
    } else {
      AdminSettings.InterfacePage.getTermsOfServiceCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should veryfy that terms of service display is disabled', () => {
    AdminSettings.InterfacePage.getTermsOfServiceCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should disable demo information checkbox', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.displayDemoInfo = false;
    } else {
      AdminSettings.InterfacePage.getDemoInfoCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that demo information display is disabled', () => {
    AdminSettings.InterfacePage.getDemoInfoCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should check if footer does not contain custom link', () => {
    AdminSettings.getFooterCustomIcon(linkURL).should(Condition.NotExist);
  });

  it('should check if footer does not contain terms of service', () => {
    AdminSettings.getFooter().should(Condition.NotContain, termsOfService);
  });

  it('should check if footer does not contain demo information', () => {
    AdminSettings.getFooter().should(Condition.NotContain, demoInfo);
  });

  it('should logout', () => {
    logout();
  });
});
