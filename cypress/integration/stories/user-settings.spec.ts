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
import {UserSettingsPage} from "../../pages/user-settings.po";

describe('User Settings Story', () => {
  const username = 'roxy';
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const kubermaticEdition = Cypress.env('KUBERMATIC_EDITION');
  const isEnterpriseEdition = kubermaticEdition === 'ee';
  const themePickerAvailability = isEnterpriseEdition ? 'available' : 'not available';
  const itemsPerPage = '5';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the user settings', () => {
    UserSettingsPage.visit();
  });

  it(`should check if user name is correct`, () => {
    UserSettingsPage.getUserName().should(Condition.Contain, username);
  });

  it(`should check if user email is correct`, () => {
    UserSettingsPage.getUserEmail().should(Condition.Contain, email);
  });

  it(`should check if theme picker is ${themePickerAvailability}`, () => {
    UserSettingsPage.getThemePicker().should(isEnterpriseEdition ? Condition.Exist : Condition.NotExist);
  });

  it(`should set ${itemsPerPage} items per page`, () => {
    UserSettingsPage.getItemsPerPageInput()
      .type(itemsPerPage)
      .should(Condition.HaveValue, itemsPerPage);
  });

  // TODO: Set theme & default project and verify it.

  it('should logout', () => {
    logout();
  });
});
