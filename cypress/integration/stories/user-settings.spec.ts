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
import {ProjectsPage} from "../../pages/projects.po";
import {prefixedString} from "../../utils/random";

describe('User Settings Story', () => {
  const username = 'roxy';
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  let projectName = prefixedString('e2e-test-project');
  const kubermaticEdition = Cypress.env('KUBERMATIC_EDITION');
  const isEnterpriseEdition = kubermaticEdition === 'ee';
  const themePickerAvailability = isEnterpriseEdition ? 'available' : 'not available';
  const itemsPerPage = '5';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
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

  // TODO: Set theme.

  it(`should set ${itemsPerPage} items per page`, () => {
    UserSettingsPage.getItemsPerPageInput().click();
    UserSettingsPage.getItemsPerPageInput()
      .get('mat-option')
      .contains(itemsPerPage).click();
  });

  it(`should set ${projectName} as default project`, () => {
    UserSettingsPage.getDefaultProjectInput().click();
    UserSettingsPage.getDefaultProjectInput()
      .get('mat-option')
      .contains(projectName).click();
  });

  it('should logout', () => {
    logout();
    cy.wait(5000);
  });

  it('should login and get redirected', () => {
    login(email, password);
    cy.wait(5000).url().should(Condition.Include, View.Clusters);
  });

  // TODO: Verify items per page and theme.

  it('should go to the user settings', () => {
    UserSettingsPage.visit();
  });

  it(`should set default items per page`, () => {
    UserSettingsPage.getItemsPerPageInput().click();
    UserSettingsPage.getItemsPerPageInput()
      .get('mat-option')
      .contains('10').click();
  });

  it(`should set unset default project`, () => {
    UserSettingsPage.getDefaultProjectInput().click();
    UserSettingsPage.getDefaultProjectInput()
      .get('mat-option')
      .contains('None').click();
  });

  it('should go to the projects page', () => {
    cy.wait(5000);
    ProjectsPage.visitUsingHeader();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
  });

  it('should logout', () => {
    logout();
  });
});
