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
import {Config} from '../../../utils/config';
import {Mocks} from '../../../utils/mocks';
import {Preset} from '../../../utils/preset';
import {Digitalocean, Provider} from '../../../utils/provider';
import {View} from '../../../utils/view';
import {WizardStep} from '../../../utils/wizard';

describe('Admin Settings - Presets Story', () => {
  const presetName = Mocks.enabled() ? 'test-preset' : _.uniqueId('test-preset-');
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const clusterName = Mocks.enabled() ? 'test-cluster' : _.uniqueId('test-cluster-');

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register(Provider.Digitalocean);
    }
  });

  it('should login as admin', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the admin settings - provider presets page', () => {
    AdminSettings.ProviderPresetsPage.visit();
  });

  it('should create a preset', () => {
    const token = 'test';

    AdminSettings.ProviderPresetsPage.getAddPresetBtn().click();
    AdminSettings.ProviderPresetsPage.getAddPresetDialogNameInput()
      .type(presetName)
      .should(Condition.HaveValue, presetName);
    AdminSettings.ProviderPresetsPage.getAddPresetDialogNextBtn().click();

    // Select provider
    AdminSettings.ProviderPresetsPage.getAddPresetDialogProviderBtn(Provider.Digitalocean).click();

    AdminSettings.ProviderPresetsPage.getAddPresetDialogDigitaloceanTokenInput()
      .type(token)
      .should(Condition.HaveValue, token);
    AdminSettings.ProviderPresetsPage.getAddPresetDialogCreateBtn().click();
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

  it('should make sure created preset is available', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Digitalocean.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
    WizardPage.getCustomPresetsCombobox().click();
    WizardPage.getPreset(presetName as Preset).click();
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
