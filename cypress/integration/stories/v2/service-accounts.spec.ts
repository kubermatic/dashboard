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

import {Pages} from '../../../pages/v2/pages';
import {Projects} from '../../../pages/v2/projects/page';
import {ServiceAccounts} from '../../../pages/v2/serviceaccounts/page';
import {Condition} from '../../../utils/condition';
import {Group} from '../../../utils/member';
import {View} from '../../../utils/view';

describe('Service Accounts Story', () => {
  const projectName = Projects.getName();
  const serviceAccountName = ServiceAccounts.getName();
  const tokenName = 'test-token';

  it('should login', () => {
    Pages.root().login();
    Pages.expect(View.Projects.Default);
  });

  it('should create a new project', () => {
    Pages.projects().create(projectName);
    Pages.projects().Elements.projectItem(projectName).should(Condition.Exist);
  });

  it('should select project', () => {
    Pages.projects().select(projectName);
    Pages.expect(View.Clusters.Default);
  });

  it('should go to the service accounts page', () => {
    Pages.serviceAccounts().visit();
    Pages.expect(View.ServiceAccounts.Default);
  });

  it('should create new service account', () => {
    Pages.serviceAccounts().create(serviceAccountName, Group.Editor);
    Pages.serviceAccounts().Buttons.tableRow(serviceAccountName).should(Condition.Exist);
    Pages.serviceAccounts().Buttons.tokenTable.should(Condition.NotBeVisible);
  });

  it('should open token panel for created service account', () => {
    Pages.serviceAccounts().Buttons.tableRow(serviceAccountName).parent().click();
    Pages.serviceAccounts().Buttons.tokenTable.should(Condition.BeVisible);
    Pages.serviceAccounts().Buttons.tokenTableRow(tokenName).should(Condition.NotExist);
  });

  it('should add token', () => {
    Pages.serviceAccounts().addToken(tokenName);
    Pages.serviceAccounts().Buttons.tokenTableRow(tokenName).should(Condition.Exist);
  });

  it('should close token panel for created service account', () => {
    Pages.serviceAccounts().Buttons.tableRow(serviceAccountName).parent().click();
    Pages.serviceAccounts().Buttons.tokenTable.should(Condition.NotBeVisible);
  });

  it('should delete service account', () => {
    Pages.serviceAccounts().delete(serviceAccountName);
    Pages.serviceAccounts().Buttons.tableRow(serviceAccountName).should(Condition.NotExist);
  });

  it('should go to the projects page', () => {
    Pages.projects().visit();
    Pages.expect(View.Projects.Default);
  });

  it('should delete the project', () => {
    Pages.projects().delete(projectName);
    Pages.projects().Elements.projectItem(projectName).should(Condition.NotExist);
  });

  it('should logout', () => {
    Pages.root().logout();
  });
});
