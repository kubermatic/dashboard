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
import {AdminSettingsPage} from '../../pages/admin-settings.po';
import {ProjectsPage} from '../../pages/projects.po';
import * as _ from 'lodash';
import {LoginPage} from "../../pages/login.po";

describe('Project Limit Story', () => {
  const userEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const adminEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const firstProjectName = _.uniqueId('e2e-test-project-');
  const secondProjectName = _.uniqueId('e2e-test-project-');
  const timeout = 5000;

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('restrict project creation to admins only', () => {
    AdminSettingsPage.getRestrictProjectCreationToAdminsCheckbox().click();
    AdminSettingsPage.getRestrictProjectCreationToAdminsCheckbox().find('input').should(Condition.BeChecked);
    cy.wait(timeout);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as normal user', () => {
    login(userEmail, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should not be able to create a new project', () => {
    ProjectsPage.getAddProjectBtn().should(Condition.BeDisabled);
    cy.wait(timeout);
    cy.reload();
  });

  it('should logout', () => {
    logout();
    LoginPage.getLoginBtn().should(Condition.Exist);
    cy.reload();
  });

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('remove restriction for project creation to admins only', () => {
    AdminSettingsPage.getRestrictProjectCreationToAdminsCheckbox().click();
    AdminSettingsPage.getRestrictProjectCreationToAdminsCheckbox().find('input').should(Condition.NotBeChecked);
    cy.wait(timeout);
  });

  it('set project limit for normal users to 1', () => {
    AdminSettingsPage.getProjectLimitInput().clear().type('1').should(Condition.HaveValue, '1');
    cy.wait(timeout);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as normal user', () => {
    login(userEmail, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should create first project', () => {
    ProjectsPage.addProject(firstProjectName);
  });

  it('should not be able to create second project', () => {
    ProjectsPage.getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    ProjectsPage.getAddProjectInput().type(secondProjectName).should(Condition.HaveValue, secondProjectName);
    ProjectsPage.getAddProjectConfirmBtn()
      .should(Condition.NotBe, 'disabled')
      .click()
      .then(() => {
        // Project should not be created because of the limit in the API, the dialog should stay open.
        cy.wait(timeout);
        ProjectsPage.getAddProjectConfirmBtn().should(Condition.BeEnabled);
        ProjectsPage.getAddProjectInput().should(Condition.HaveValue, secondProjectName);
        // Close the dialog.
        cy.reload();
      });
  });

  it('should delete first project', () => {
    ProjectsPage.deleteProject(firstProjectName);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('remove project limit', () => {
    AdminSettingsPage.getProjectLimitInput().clear().type('0').should(Condition.HaveValue, '0');
    cy.wait(timeout);
  });

  it('should logout', () => {
    logout();
  });
});
