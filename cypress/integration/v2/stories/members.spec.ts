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

import {Condition} from '../../../utils/condition';
import {Group} from '../../../utils/member';
import {View} from '../../../utils/view';
import {Config} from '../../../utils/config';
import {Pages} from '../../../pages/v2/pages';
import {Projects} from '../../../pages/v2/projects/page';

describe('Members Story', () => {
  const projectName = Projects.getName();

  it('should login as a first user', () => {
    Pages.Root.login(Config.adminEmail(), Config.password(), true);
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should create a new project', () => {
    Pages.Projects.create(projectName);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
  });

  it('should select project', () => {
    Pages.Projects.select(projectName);
    Pages.expect(View.Clusters.Default);
  });

  it('should go to the members page', () => {
    Pages.Members.visit();
    Pages.expect(View.Members.Default);
  });

  it('should add a new member', () => {
    Pages.Members.add(Config.userEmail(), Group.Editor);
  });

  it('should logout', () => {
    Pages.Root.logout();
  });

  it('should login as a second user', () => {
    Pages.Root.login();
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should check if multi owner project is in list', () => {
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
  });

  it('should select project', () => {
    Pages.Projects.select(projectName);
    Pages.expect(View.Clusters.Default);
  });

  it('should go to the members page', () => {
    Pages.Members.visit();
    Pages.expect(View.Members.Default);
  });

  it('should delete first user from project', () => {
    Pages.Members.delete(Config.adminEmail());
    Pages.Members.Buttons.tableRow(Config.adminEmail()).should(Condition.NotExist);
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
