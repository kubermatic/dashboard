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

import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {ServiceAccountsPage} from '../../pages/service-accounts.po';
import {Group} from '../../utils/member';
import {View} from '../../utils/view';
import _ from 'lodash';
import {Mocks} from '../../utils/mocks';

describe('Service Accounts Story', () => {
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const serviceAccountName = 'test-sa';
  const tokenName = 'test-token';

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

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to the services accounts page', () => {
    ServiceAccountsPage.visit();
  });

  it('should create new services account', () => {
    ServiceAccountsPage.addServiceAccount(serviceAccountName, Group.Editor);
  });

  it('should open token panel for created services account', () => {
    ServiceAccountsPage.getTableRow(serviceAccountName).click();
  });

  it('should add token', () => {
    ServiceAccountsPage.addToken(tokenName);
  });

  it('should close token panel for created services account', () => {
    ServiceAccountsPage.getTableRow(serviceAccountName).click();
  });

  it('should delete services account', () => {
    ServiceAccountsPage.deleteServiceAccount(serviceAccountName);
  });

  it('should verify that there are no services accounts', () => {
    ServiceAccountsPage.verifyNoServiceAccounts();
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
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
