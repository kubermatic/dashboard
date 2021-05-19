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

import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {View} from '../../../utils/view';
import {AdminSettingsPage} from '../../../pages/admin-settings.po';
import {ProjectsPage} from "../../../pages/projects.po";
import * as _ from "lodash";
import {ClustersPage} from "../../../pages/clusters.po";

describe('Admin Settings - Dynamic Datacenters Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('should switch to dynamic datacenters tab', () => {
    AdminSettingsPage.getDynamicDatacentersTab().click();
  });

  it('should open add datacenter dialog', () => {

  });

  it('should add new datacenter', () => {

  });

  it('should go to projects view', () => {
    ProjectsPage.visitUsingHeader();
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should create a new cluster in the new datacenter', () => {
    // WizardPage.getProviderBtn(Provider.BringYourOwn).click();
    // WizardPage.getDatacenterBtn(Datacenter.BringYourOwn.Frankfurt).click();
    // WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    // WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
    // WizardPage.getCreateBtn().click({force: true});
    //
    // ClustersPage.verifyUrl();
  });

  it('should delete created cluster', () => {
    ClustersPage.visit();
    ClustersPage.getClusterItem(clusterName).click();
    ClustersPage.deleteCluster(clusterName);
  });

  it('should verify that there are no clusters', () => {
    ClustersPage.verifyNoClusters();
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
