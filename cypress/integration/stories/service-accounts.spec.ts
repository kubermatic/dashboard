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

import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {ServiceAccountsPage} from '../../pages/service-accounts.po';
import {Group} from '../../utils/member';
import {View} from '../../utils/view';
import * as _ from 'lodash';

describe('Service Accounts Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');
  const serviceAccountName = 'test-sa';
  const tokenName = 'test-token';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to the service accounts page', () => {
    ServiceAccountsPage.visit();
  });

  it('should create new service account', () => {
    ServiceAccountsPage.addServiceAccount(serviceAccountName, Group.Editor);
  });

  it('should open token panel for created service account', () => {
    ServiceAccountsPage.getTableRow(serviceAccountName).click();
  });

  it('should add token', () => {
    ServiceAccountsPage.addToken(tokenName);
  });

  it('should close token panel for created service account', () => {
    ServiceAccountsPage.getTableRow(serviceAccountName).click();
  });

  it('should delete service account', () => {
    ServiceAccountsPage.deleteServiceAccount(serviceAccountName);
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
  });

  it('should logout', () => {
    logout();
  });
});
