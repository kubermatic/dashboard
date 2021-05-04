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

import * as _ from 'lodash';
import {ClustersPage} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {View} from '../../utils/view';

describe('External Cluster Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const kubeconfig = Cypress.env('KUBECONFIG');
  const projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');

  it('should login', () => {
    login(email, password);

    cy.url().should(Condition.Include, View.Projects);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should open connect cluster dialog', () => {
    ClustersPage.getConnectClusterBtn().click();
  });

  it('should enter name', () => {
    ClustersPage.getConnectClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
  });

  it('should enter kubeconfig', () => {
    ClustersPage.getConnectClusterKubeconfigTextarea().click({force: true}).focused().type(kubeconfig);
  });

  it('should connect cluster', () => {
    ClustersPage.getConnectClusterSaveButton().click();
    ClustersPage.verifyUrl();
  });

  it('should verify details of connected cluster', () => {
    // TODO
  });

  it('should disconnect cluster', () => {
    // TODO
  });

  it('should verify that there are no clusters', () => {
    ClustersPage.visit();
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
