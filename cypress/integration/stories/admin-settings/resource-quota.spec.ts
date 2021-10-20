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

describe('Admin Settings - Resource Quota Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');
  const smallSize = 's-1vcpu-1gb';
  const bigSize = 'c2-16vcpu-32gb';
  const minCPU = 2;
  const minRAM = 2;

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the admin settings - defaults page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should update resource quota', () => {
    AdminSettings.DefaultsAndLimitsPage.getMinCPUResourceQuotaInput().clear().type(`${minCPU}`).trigger('change');
    AdminSettings.waitForSave();
    AdminSettings.DefaultsAndLimitsPage.getMinRAMResourceQuotaInput().clear().type(`${minRAM}`).trigger('change');
    AdminSettings.waitForSave();
    AdminSettings.DefaultsAndLimitsPage.getMinCPUResourceQuotaInput().should(Condition.HaveValue, minCPU);
    AdminSettings.DefaultsAndLimitsPage.getMinRAMResourceQuotaInput().should(Condition.HaveValue, minRAM);
  });

  it('should go to projects view', () => {
    ProjectsPage.visit();
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to wizard', () => {
    ClustersPage.openWizard();
  });

  it('should make sure node sizes match admin settings', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
    WizardPage.getCustomPresetsCombobox().click();

    const monitor = TrafficMonitor.newTrafficMonitor()
      .url(Endpoint.Digitalocean.Sizes)
      .method(RequestType.GET)
      .intercept();
    WizardPage.getPreset(Preset.Digitalocean).click();
    monitor.wait();

    WizardPage.getNextBtn(WizardStep.ProviderSettings).click({force: true});
    WizardPage.digitalocean.getNodeSizesCombobox().click();
    WizardPage.digitalocean.getNodeSize(smallSize).should(Condition.NotExist);
    WizardPage.digitalocean.getNodeSize(bigSize).should(Condition.Exist);
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
