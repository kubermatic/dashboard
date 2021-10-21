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

import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {View} from '../../../utils/view';
import {AdminSettings} from '../../../pages/admin-settings.po';
import {ProjectsPage} from '../../../pages/projects.po';
import _ from 'lodash';
import {LoginPage} from '../../../pages/login.po';
import {Config} from '../../../utils/config';
import {Mocks} from '../../../utils/mocks';
import {Endpoint} from '../../../utils/endpoint';
import {RequestType} from '../../../utils/monitor';

describe('Admin Settings - Project Limit Story', () => {
  const firstProjectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const secondProjectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const shortTimeout = 100;
  const longTimeout = 10000;
  const timeout = Mocks.enabled() ? shortTimeout : longTimeout;

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login as admin', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - default page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('restrict project creation to admins only', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.restrictProjectCreation = true;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify project creation restriction', () => {
    AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox()
      .find('input')
      .should(Condition.BeChecked);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as normal user', () => {
    login(Config.userEmail(), Config.password(), false);
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
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('remove restriction for project creation to admins only', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.restrictProjectCreation = false;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify project creation restriction is off', () => {
    AdminSettings.DefaultsAndLimitsPage.getRestrictProjectCreationToAdminsCheckbox()
      .find('input')
      .should(Condition.NotBeChecked);
  });

  it('set project limit for normal users to 1', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.userProjectsLimit = 1;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().clear().type('1').trigger('change');
      AdminSettings.waitForSave();
    }
  });

  it('should verify project limit for normal users', () => {
    AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().should(Condition.HaveValue, '1');
  });

  it('should logout', () => {
    logout();
  });

  it('should login as normal user', () => {
    login(Config.userEmail(), Config.password(), false);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create first project', () => {
    ProjectsPage.addProject(firstProjectName);
  });

  it('should not be able to create second project', () => {
    if (Mocks.enabled()) {
      cy.intercept(RequestType.POST, Endpoint.Projects, {statusCode: 500});
    }

    ProjectsPage.getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    ProjectsPage.getAddProjectInput().type(secondProjectName).should(Condition.HaveValue, secondProjectName);
    ProjectsPage.getAddProjectConfirmBtn().should(Condition.NotBe, 'disabled').click();
    ProjectsPage.getDialogCloseButton().click();
  });

  it('should delete first project', () => {
    ProjectsPage.deleteProject(firstProjectName);
  });

  it('should verify that there are no projects', () => {
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });

  it('should login as admin', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - defaults page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('remove project limit', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.userProjectsLimit = 0;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().clear().type('0').trigger('change');
      AdminSettings.waitForSave();
    }
  });

  it('should verify project limit for normal users', () => {
    AdminSettings.DefaultsAndLimitsPage.getProjectLimitInput().should(Condition.HaveValue, '0');
  });

  it('should logout', () => {
    logout();
  });
});
