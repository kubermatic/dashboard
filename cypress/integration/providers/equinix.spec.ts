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

import {ClustersPage} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Preset} from '../../utils/preset';
import {Datacenter, Provider} from '../../utils/provider';
import {View} from '../../utils/view';
import {WizardStep} from '../../utils/wizard';
import * as _ from 'lodash';
import {mockClusterEndpoints, mockConfigEndpoints, mockLogin, mockProjectEndpoints} from '../../utils/mock';

describe('Equinix Provider', () => {
  const useMocks = Cypress.env('USE_MOCKS');
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const preset = useMocks ? Preset.Mock : Preset.Equinix;
  const projectName = useMocks ? 'test-project' : _.uniqueId('test-project-');
  const clusterName = useMocks ? 'test-cluster' : _.uniqueId('test-cluster-');
  const initialMachineDeploymentName = useMocks ? 'test-md' : _.uniqueId('test-md-');
  const initialMachineDeploymentReplicas = '0';

  beforeEach(() => {
    if (useMocks) {
      mockConfigEndpoints();
      mockProjectEndpoints();
      mockClusterEndpoints(Provider.Equinix);
    }
  });

  it('should login', () => {
    if (useMocks) {
      mockLogin();
    } else {
      login(email, password);
    }

    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to wizard', () => {
    ClustersPage.openWizard();
  });

  it('should create a new cluster', () => {
    WizardPage.getProviderBtn(Provider.Equinix).click();
    WizardPage.getDatacenterBtn(Datacenter.Equinix.NewYork).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
    WizardPage.getCustomPresetsCombobox().click();
    WizardPage.getPreset(preset).click();
    WizardPage.getNextBtn(WizardStep.ProviderSettings).click({force: true});
    WizardPage.getNodeNameInput()
      .type(initialMachineDeploymentName)
      .should(Condition.HaveValue, initialMachineDeploymentName);
    WizardPage.getNodeCountInput()
      .clear()
      .type(initialMachineDeploymentReplicas)
      .should(Condition.HaveValue, initialMachineDeploymentReplicas);
    WizardPage.getNextBtn(WizardStep.NodeSettings).should(Condition.BeEnabled).click({force: true});
    WizardPage.getCreateBtn().click({force: true});

    cy.url().should(Condition.Contain, View.Clusters.Default);
  });

  it('should check if cluster was created', () => {
    ClustersPage.visit();
    ClustersPage.getTable().should(Condition.Contain, clusterName);
  });

  it('should go to cluster details page', () => {
    ClustersPage.getClusterItem(clusterName).click();
  });

  it('should wait for the cluster to be ready', () => {
    ClustersPage.getClusterName().should(Condition.Contain, clusterName);
    ClustersPage.getClusterStatus().should(Condition.HaveClass, 'km-success-bg');
  });

  it('should delete created cluster', () => {
    ClustersPage.deleteCluster(clusterName);

    if (useMocks) {
      cy.intercept({method: 'GET', path: '**/api/**/projects/*/clusters'}, []).as('listClusters');
    }

    ClustersPage.verifyNoCluster(clusterName);
  });

  it('should verify that there are no clusters', () => {
    if (useMocks) {
      cy.intercept({method: 'GET', path: '**/api/**/projects/*/clusters'}, []).as('listClusters');
    }

    ClustersPage.verifyNoClusters();
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);

    if (useMocks) {
      cy.intercept({method: 'GET', path: '**/api/**/projects*'}, []).as('listProjects');
    }

    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
