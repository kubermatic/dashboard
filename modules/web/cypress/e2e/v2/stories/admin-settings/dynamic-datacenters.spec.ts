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
import {BringYourOwn, Condition, Provider, View} from '@kmtypes';
import {DynamicDatacenters, Pages, Projects} from '@pages/v2';
import {Config} from '@utils/config';

describe('Admin Settings - Datacenters Story', () => {
  const projectName = Projects.getName();
  const datacenterName = DynamicDatacenters.getName();
  const seedName = Config.seedName();
  const country = 'Germany';
  const location = BringYourOwn.Hamburg;
  const provider = Provider.kubeadm;

  beforeEach(() => Intercept.init());

  it('should login', () => {
    Pages.Root.login(Config.adminEmail(), Config.password(), true);
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should create a new project', () => {
    Pages.Projects.create(projectName);
    Pages.Projects.Buttons.projectViewType('projectstable').should(Condition.Exist);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
  });

  it('should go to the admin settings - datacenters page', () => {
    Pages.AdminSettings.visit();
    Pages.expect(View.AdminSettings.DefaultsAndLimits);
    Pages.AdminSettings.DynamicDatacenters.manageResourcesSideNavItem();
    Pages.AdminSettings.DynamicDatacenters.visit();
    Pages.expect(View.AdminSettings.DynamicDatacenters);
  });

  it('should successfully create and then delete a datacenter', () => {
    Pages.AdminSettings.DynamicDatacenters.create(datacenterName, provider, seedName, country, location);
    cy.wait('@createDatacenter');
    Pages.AdminSettings.DynamicDatacenters.Buttons.deleteDatacenter(datacenterName)
      .should(Condition.Exist)
      .and(Condition.BeVisible)
      .and(Condition.BeEnabled);

    Pages.AdminSettings.DynamicDatacenters.delete(datacenterName);
    cy.wait('@deleteDatacenter');

    cy.wait('@getDatacenters');
    Pages.AdminSettings.DynamicDatacenters.Buttons.deleteDatacenter(datacenterName).should(Condition.NotExist);
  });

  it('should delete created project and logout', () => {
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);

    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.delete(projectName);

    const deletionTimeout = 60000;
    Pages.Projects.Elements.projectItem(projectName, deletionTimeout).should(Condition.NotExist);

    Pages.Root.logout();
  });
});
