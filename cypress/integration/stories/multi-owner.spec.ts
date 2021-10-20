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

import {MembersPage} from '../../pages/members.po';
import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Group, reloadUsers} from '../../utils/member';
import {ClustersPage} from '../../pages/clusters.po';
import {View} from '../../utils/view';
import _ from 'lodash';
import {Mocks} from '../../utils/mocks';

describe('Multi Owner Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const newUserEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login as a first owner', () => {
    login();
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
    login(newUserEmail);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should wait for autoredirect and go back to projects', () => {
    if (Mocks.enabled()) {
      cy.setCookie('autoredirect', 'true');
    }

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
  });

  it('should verify that first owner was deleted from project', () => {
    reloadUsers();
    MembersPage.verifyNoMember(email);
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
