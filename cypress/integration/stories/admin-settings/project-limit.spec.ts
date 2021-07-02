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
import {AdminSettings} from '../../../pages/admin-settings.po';
import {ProjectsPage} from '../../../pages/projects.po';
import * as _ from 'lodash';
import {LoginPage} from '../../../pages/login.po';
import {RequestType, Response, ResponseType, TrafficMonitor} from '../../../utils/monitor';
import {Endpoint} from '../../../utils/endpoint';

describe('Admin Settings - Project Limit Story', () => {
  const userEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const adminEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const firstProjectName = _.uniqueId('e2e-test-project-');
  const secondProjectName = _.uniqueId('e2e-test-project-');
  const timeout = 10000;
  const retries = 5;

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - default page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('restrict project creation to admins only', () => {
    AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox().click();
    AdminSettings.waitForSave();
    AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox()
      .find('input')
      .should(Condition.BeChecked);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as normal user', () => {
    login(userEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should not be able to create a new project', () => {
    ProjectsPage.getAddProjectBtn().should(Condition.BeDisabled);
  });

  it('should logout', () => {
    cy.wait(timeout);
    cy.reload();
    logout();
    LoginPage.getLoginBtn().should(Condition.Exist);
    cy.reload();
  });

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('remove restriction for project creation to admins only', () => {
    AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox().click();
    AdminSettings.waitForSave();
    AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox()
      .find('input')
      .should(Condition.NotBeChecked);
  });

  it('set project limit for normal users to 1', () => {
    AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().clear().type('1').trigger('change');
    AdminSettings.waitForSave();
    AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().should(Condition.HaveValue, '1');
  });

  it('should logout', () => {
    logout();
  });

  it('should login as normal user', () => {
    login(userEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create first project', () => {
    ProjectsPage.addProject(firstProjectName);
  });

  it('should not be able to create second project', () => {
    ProjectsPage.getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    ProjectsPage.getAddProjectInput().type(secondProjectName).should(Condition.HaveValue, secondProjectName);
    ProjectsPage.getAddProjectConfirmBtn().should(Condition.NotBe, 'disabled').click();
    ProjectsPage.getDialogCloseButton().click();
  });

  it('should delete first project', () => {
    ProjectsPage.deleteProject(firstProjectName);
  });

  it('should verify there are no projects', () => {
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Projects)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(0));
  });

  it('should logout', () => {
    logout();
  });

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - defaults page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('remove project limit', () => {
    AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().clear().type('0').trigger('change');
    AdminSettings.waitForSave();
    AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().should(Condition.HaveValue, '0');
  });

  it('should logout', () => {
    logout();
  });
});
