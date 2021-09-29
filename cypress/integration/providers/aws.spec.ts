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
import {mockAuthCookies} from "../../utils/mock";

describe('AWS Provider', () => {
  const useMocks = true;
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const preset = useMocks ? Preset.Mock : Preset.AWS;
  const projectName = useMocks ? 'test-project' : _.uniqueId('test-project-');
  const clusterName = useMocks ? 'test-cluster' : _.uniqueId('test-cluster-');
  const initialMachineDeploymentName = useMocks ? 'test-md' : _.uniqueId('test-md-');
  const initialMachineDeploymentReplicas = '0';

  beforeEach(() => {
    if (useMocks) {
      cy.intercept({method: 'GET', path: '**/seed'}, {fixture: 'config/seeds.json'}).as('getSeeds');
      cy.intercept({method: 'GET', path: '**/seeds/kubermatic/settings'}, {fixture: 'config/seed-settings.json'}).as('getSeedSettings');
      cy.intercept({method: 'GET', path: '**/dc'}, {fixture: 'config/datacenters.json'}).as('getDatacenters');
      cy.intercept({method: 'GET', path: '**/projects?displayAll=false'}, {fixture: 'projects/list.json'}).as('listProjects');
      cy.intercept({method: 'GET', path: '**/projects/*'}, {fixture: 'projects/single.json'}).as('getProject');
      cy.intercept({method: 'POST', path: '**/projects'}, {fixture: 'projects/single.json'}).as('createProject');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters'}, {fixture: 'clusters/aws/list.json'}).as('listClusters');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*'}, {fixture: 'clusters/aws/single.json'}).as('getCluster');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/health'}, {fixture: 'clusters/health.json'}).as('getClusterHealth');
      cy.intercept({method: 'POST', path: '**/projects/*/clusters'}, {fixture: 'clusters/aws/single.json'}).as('createCluster');
      cy.intercept({method: 'GET', path: '**/projects/*/kubernetes/clusters'}, {fixture: 'empty.json'}).as('listExternalClusters');
      cy.intercept({method: 'GET', path: '**/providers/aws/presets*'}, {fixture: 'config/preset.json'}).as('listPresets');
      cy.intercept({method: 'GET', path: '**/providers/aws/*/subnets'}, {fixture: 'clusters/aws/subnets.json'}).as('listSubnets');
      cy.intercept({method: 'GET', path: '**/projects/*/etcdrestores'}, {fixture: 'empty.json'}).as('listEtcdRestores');
      cy.intercept({method: 'GET', path: '**/projects/*/sshkeys'}, {fixture: 'empty.json'}).as('listSSHKeys');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/sshkeys'}, {fixture: 'empty.json'}).as('listSSHKeys');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/events'}, {fixture: 'empty.json'}).as('listEvents');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/bindings'}, {fixture: 'empty.json'}).as('listBindings');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/clusterbindings'}, {fixture: 'empty.json'}).as('listClusterBindings');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/rulegroups'}, {fixture: 'empty.json'}).as('listRuleGroups');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/machinedeployments'}, {fixture: 'empty.json'}).as('listMachineDeployments');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/nodes**'}, {fixture: 'empty.json'}).as('listNodes');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/addons'}, {fixture: 'empty.json'}).as('listAddons');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/upgrades'}, {fixture: 'empty.json'}).as('listUpgrades');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/metrics'}, {fixture: 'empty.json'}).as('listMetrics');
      cy.intercept({method: 'GET', path: '**/projects/*/clusters/*/alertmanager/config'}, {fixture: 'empty-item.json'}).as('getAlergManagerConfig');
    }
  });

  it('should login', () => {
    if (useMocks) {
      mockAuthCookies();
      cy.setCookie('autoredirect', 'false');
      cy.visit('/projects');
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
    WizardPage.getProviderBtn(Provider.AWS).click();
    WizardPage.getDatacenterBtn(Datacenter.AWS.Frankfurt).click();
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
      cy.intercept({method: 'GET', path: '**/projects/*/clusters'}, {fixture: 'empty.json'}).as('listClusters');
    }

    ClustersPage.verifyNoCluster(clusterName);
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
