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

import {Intercept} from '@intercept';
import {Condition, Group, View} from '@kmtypes';
import {Pages, Projects, ServiceAccounts} from '@pages/v2';

describe('Service Accounts Story', () => {
  const projectName = Projects.getName();
  const serviceAccountName = ServiceAccounts.getName();
  const tokenName = 'test-token';

  beforeEach(() => Intercept.init());

  it('should login', () => {
    Pages.Root.login();
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should create a new project', () => {
    Pages.Projects.create(projectName);
    Pages.Projects.Buttons.projectViewType('projectstable').should(Condition.Exist);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    // TODO: extract icon statuses to enum
    Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
  });

  it('should select project', () => {
    Pages.Projects.select(projectName);
    Pages.expect(View.Overview.Default);
  });

  it('should go to the service accounts page', () => {
    Pages.Members.accessSideNavItem();
    Pages.ServiceAccounts.visit();
    Pages.expect(View.ServiceAccounts.Default);
  });

  it('should create new service account', () => {
    Pages.ServiceAccounts.create(serviceAccountName, Group.Editor);
    Pages.ServiceAccounts.Buttons.serviceAccountNameColumn(serviceAccountName).should(Condition.Exist);
    Pages.ServiceAccounts.Buttons.tokenTable.should(Condition.NotBeVisible);
  });

  it('should open token panel for created service account', () => {
    Pages.ServiceAccounts.Buttons.serviceAccountNameColumn(serviceAccountName).parent().click();
    Pages.ServiceAccounts.Buttons.tokenTable.should(Condition.BeVisible);
    Pages.ServiceAccounts.Buttons.noTokensAvailable.should(Condition.BeVisible);
    Pages.ServiceAccounts.Buttons.tokenName(tokenName).should(Condition.NotExist);
  });

  it('should add token', () => {
    Pages.ServiceAccounts.addToken(tokenName);
    Pages.ServiceAccounts.Buttons.tokenName(tokenName).should(Condition.Exist);
  });

  it('should close token panel for created service account', () => {
    Pages.ServiceAccounts.Buttons.serviceAccountNameColumn(serviceAccountName).parent().click();
    Pages.ServiceAccounts.Buttons.tokenTable.should(Condition.NotBeVisible);
  });

  it('should delete service account', () => {
    Pages.ServiceAccounts.delete(serviceAccountName);
    Pages.ServiceAccounts.Buttons.serviceAccountNameColumn(serviceAccountName).should(Condition.NotExist);
  });

  it('should go to the projects page', () => {
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should delete the project', () => {
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.delete(projectName);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.NotExist);
  });

  it('should logout', () => {
    Pages.Root.logout();
  });
});
