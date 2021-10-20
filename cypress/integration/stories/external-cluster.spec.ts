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

import _ from 'lodash';
import {ClustersPage} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Mocks} from '../../utils/mocks';
import {View} from '../../utils/view';

describe('External Cluster Story', () => {
  const kubeconfig = Mocks.enabled() ? 'test-kubeconfig' : atob(Cypress.env('KUBECONFIG_ENCODED'));
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const clusterName = Mocks.enabled() ? 'test-cluster' : _.uniqueId('test-cluster-');

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

  it('should open connect cluster dialog', () => {
    ClustersPage.getConnectClusterBtn().click();
  });

  it('should enter name', () => {
    ClustersPage.getConnectClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
  });

  it('should enter kubeconfig', () => {
    ClustersPage.getConnectClusterKubeconfigTextarea()
      .click({force: true})
      .then($element => {
        const subString = kubeconfig.substr(0, kubeconfig.length - 1);
        const lastChar = kubeconfig.slice(-1);
        $element.text(subString);
        $element.val(subString);
        cy.get($element).type(lastChar);
      });
  });

  it('should connect cluster', () => {
    ClustersPage.getConnectClusterSaveBtn().click();
    ClustersPage.verifyExternalClustersUrl();
  });

  it('should verify details of connected cluster', () => {
    ClustersPage.getPrimaryLabel().should(Condition.Contain, 'External');
  });

  it('should disconnect cluster', () => {
    ClustersPage.getDeleteClusterBtn().click();
    ClustersPage.getDisconnectConfirmBtn().click();
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

  it('should verify that there are no projects', () => {
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
