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
import {AdminSettings} from '../../../pages/admin-settings.po';
import {ClustersPage} from '../../../pages/clusters.po';
import {ProjectsPage} from '../../../pages/projects.po';
import {WizardPage} from '../../../pages/wizard.po';
import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {Endpoint} from '../../../utils/endpoint';
import {RequestType, TrafficMonitor} from '../../../utils/monitor';
import {Preset} from '../../../utils/preset';
import {Datacenter, Provider} from '../../../utils/provider';
import {View} from '../../../utils/view';
import {WizardStep} from '../../../utils/wizard';

describe('Admin Settings - Cluster Related Settings Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');
  const initialMachineDeploymentName = _.uniqueId('e2e-test-md-');
  const initialMachineDeploymentReplicas = '1';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the admin settings - defaults and limits page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should make sure settings have default values', () => {
    AdminSettings.DefaultsAndLimitsPage.getCleanupEnableCheckbox().find('input').should(Condition.NotBeChecked);
    AdminSettings.DefaultsAndLimitsPage.getCleanupEnforceCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should go to the admin settings - interface page', () => {
    AdminSettings.InterfacePage.visit();
  });

  it('should make sure settings have default values', () => {
    AdminSettings.InterfacePage.getEnableKubernetesDashboardCheckbox().find('input').should(Condition.BeChecked);
    AdminSettings.InterfacePage.getEnableOIDCCheckbox().find('input').should(Condition.NotBeChecked);
    AdminSettings.InterfacePage.getEnableExternalClustersCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should go to projects view', () => {
    ProjectsPage.visit();
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should make sure connect cluster button is visible', () => {
    ProjectsPage.getConnectClusterBtn().should(Condition.Exist);
  });

  it('should go to wizard', () => {
    ClustersPage.openWizard();
  });

  it('should create a new cluster', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
    WizardPage.getCustomPresetsCombobox().click();
    WizardPage.getPreset(Preset.Digitalocean).click();
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

  it('should wait for initial machine deployment to be created', () => {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.MachineDeployments).interceptAndWait();
    ClustersPage.getMachineDeploymentList().should(Condition.Contain, initialMachineDeploymentName);
  });

  it('should make sure default admin settings work', () => {
    // Cleanup settings check
    ClustersPage.getDeleteClusterBtn().click();
    ClustersPage.getDeleteDialogCleanupLBCheckbox().find('input').should(Condition.NotBeChecked);
    ClustersPage.getDeleteDialogCleanupVolumeCheckbox().find('input').should(Condition.NotBeChecked);
    ClustersPage.getDialogCloseButton().click();

    // Kubernetes Dashboard settings check
    ClustersPage.getOpenKubernetesDashboardButton().should(Condition.Exist);

    // OIDC Kubeconfig settings check
    // Note: This is actually a workaround to simplify this check as it directly depends
    // on the OIDC kubeconfig setting. Make sure to have also `share_kubeconfig` set to true.
    ClustersPage.getShareKubeconfigButton().should(Condition.Exist);
  });

  it('should go to the admin settings - defaults and limits page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should make sure settings have default values', () => {
    AdminSettings.DefaultsAndLimitsPage.getCleanupEnableCheckbox().click();
    AdminSettings.waitForSave();

    AdminSettings.DefaultsAndLimitsPage.getCleanupEnforceCheckbox().click();
    AdminSettings.waitForSave();
  });

  it('should go to the admin settings - interface page', () => {
    AdminSettings.InterfacePage.visit();
  });

  it('should make sure settings have default values', () => {
    AdminSettings.InterfacePage.getEnableKubernetesDashboardCheckbox().click();
    AdminSettings.waitForSave();

    AdminSettings.InterfacePage.getEnableOIDCCheckbox().click();
    AdminSettings.waitForSave();

    AdminSettings.InterfacePage.getEnableExternalClustersCheckbox().click();
    AdminSettings.waitForSave();
  });

  it('should go to projects view', () => {
    ProjectsPage.visit();
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should make sure connect cluster button is not visible', () => {
    ProjectsPage.getConnectClusterBtn().should(Condition.NotExist);
  });

  it('should go to cluster details page', () => {
    ClustersPage.getClusterItem(clusterName).click();
  });

  it('should make sure default admin settings work', () => {
    // Cleanup settings check
    ClustersPage.getDeleteClusterBtn().click();
    ClustersPage.getDeleteDialogCleanupLBCheckbox().find('input').should(Condition.BeChecked);
    ClustersPage.getDeleteDialogCleanupLBCheckbox().find('input').should(Condition.BeDisabled);
    ClustersPage.getDeleteDialogCleanupVolumeCheckbox().find('input').should(Condition.BeChecked);
    ClustersPage.getDeleteDialogCleanupVolumeCheckbox().find('input').should(Condition.BeDisabled);
    ClustersPage.getDialogCloseButton().click();

    // Kubernetes Dashboard settings check
    ClustersPage.getOpenKubernetesDashboardButton().should(Condition.NotExist);

    // OIDC Kubeconfig settings check
    ClustersPage.getShareKubeconfigButton().should(Condition.NotExist);
  });

  it('should go to the admin settings - defaults and limits page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should make sure settings have default values', () => {
    AdminSettings.DefaultsAndLimitsPage.getCleanupEnableCheckbox().click();
    AdminSettings.waitForSave();

    AdminSettings.DefaultsAndLimitsPage.getCleanupEnforceCheckbox().click();
    AdminSettings.waitForSave();
  });

  it('should go to the admin settings - interface page', () => {
    AdminSettings.InterfacePage.visit();
  });

  it('should make sure settings have default values', () => {
    AdminSettings.InterfacePage.getEnableKubernetesDashboardCheckbox().click();
    AdminSettings.waitForSave();

    AdminSettings.InterfacePage.getEnableOIDCCheckbox().click();
    AdminSettings.waitForSave();

    AdminSettings.InterfacePage.getEnableExternalClustersCheckbox().click();
    AdminSettings.waitForSave();
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
