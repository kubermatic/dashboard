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

import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {View} from '../../utils/view';
import {UserSettingsPage} from '../../pages/user-settings.po';
import {ProjectsPage} from '../../pages/projects.po';
import _ from 'lodash';
import {Mocks} from '../../utils/mocks';
import {Config} from '../../utils/config';

describe('User Settings Story', () => {
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const itemsPerPage = '5';
  const waitTime = 5000;

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login', () => {
    login();
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the user settings', () => {
    UserSettingsPage.visit();
  });

  it('should check if user email is correct', () => {
    UserSettingsPage.getUserEmail().should(Condition.Contain, Config.userEmail());
  });

  it(`should check if theme picker is ${Config.isEnterpriseEdition() ? 'available' : 'not available'}`, () => {
    UserSettingsPage.getThemePicker().should(Config.isEnterpriseEdition() ? Condition.Exist : Condition.NotExist);
  });

  if (Config.isEnterpriseEdition()) {
    it('should set dark theme', () => {
      UserSettingsPage.getThemeButton('dark').click();
      cy.get('.km-style-dark').should(Condition.Exist);
    });
  }

  it(`should set ${itemsPerPage} items per page`, () => {
    UserSettingsPage.getItemsPerPageInput().click();
    UserSettingsPage.getItemsPerPageInput().get('mat-option').contains(itemsPerPage).click();
  });

  it(`should set ${projectName} as default project`, () => {
    UserSettingsPage.getDefaultProjectInput().click();
    UserSettingsPage.getDefaultProjectInput().get('mat-option').contains(projectName).click();
  });

  it('should logout', () => {
    logout();
    cy.wait(waitTime);
  });

  it('should login and get redirected', () => {
    login();

    if (Mocks.enabled()) {
      cy.setCookie('autoredirect', 'true');
    } else {
      cy.wait(waitTime);
    }

    cy.url().should(Condition.Include, View.Clusters.Default);
  });

  it('should go to the user settings', () => {
    UserSettingsPage.visit();
  });

  if (Config.isEnterpriseEdition()) {
    it('should set default theme', () => {
      UserSettingsPage.getThemeButton('light').click();
      cy.get('.km-style-light').should(Condition.Exist);
    });
  }

  it('should set default items per page', () => {
    UserSettingsPage.getItemsPerPageInput().click();
    UserSettingsPage.getItemsPerPageInput().get('mat-option').contains('10').click();
  });

  it('should set unset default project', () => {
    UserSettingsPage.getDefaultProjectInput().click();
    UserSettingsPage.getDefaultProjectInput().get('mat-option').contains('None').click();
  });

  it('should go to the projects page', () => {
    cy.wait(waitTime);
    ProjectsPage.visitUsingHeader();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
  });

  it('should verify that there are no projects', () => {
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
