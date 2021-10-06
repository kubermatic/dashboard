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

import {MembersPage} from '../../pages/members.po';
import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Group, reloadUsers} from '../../utils/member';
import {ClustersPage} from '../../pages/clusters.po';
import {View} from '../../utils/view';
import * as _ from 'lodash';

describe('Multi Owner Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const newUserEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const projectName = _.uniqueId('e2e-test-project-');

  it('should login as a first owner', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to members view', () => {
    MembersPage.visit();
  });

  it('should add a new member', () => {
    MembersPage.addMember(newUserEmail, Group.Owner);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as a second owner', () => {
    login(newUserEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should wait for autoredirect and go back to projects', () => {
    ClustersPage.waitForRefresh();
    ProjectsPage.visit();
  });

  it('should check if multi owner project is in list', () => {
    ProjectsPage.getProjectItem(projectName).should(Condition.HaveLength, 1);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to members view', () => {
    MembersPage.visit();
  });

  it('should delete first owner from project', () => {
    MembersPage.getDeleteBtn(email).click();
    MembersPage.getDeleteMemberDialogDeleteBtn().click();

    reloadUsers();

    MembersPage.getTableRowEmailColumn(email).should(Condition.NotExist);
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
