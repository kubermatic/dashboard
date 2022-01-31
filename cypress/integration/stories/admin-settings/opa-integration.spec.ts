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
import {Datacenter, Provider} from '../../../utils/provider';
import {View} from '../../../utils/view';

describe('Admin Settings - Opa Integration Story', () => {
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('e2e-test-project-');

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the admin settings - defaults page', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should make sure opa integration enable settings is not checked', () => {
    AdminSettings.DefaultsAndLimitsPage.getOPAEnableCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should make sure opa integration enforce settings is not checked', () => {
    AdminSettings.DefaultsAndLimitsPage.getOPAEnforceCheckbox().find('input').should(Condition.NotBeChecked);
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

  it('should make sure opa integration in wizard is enabled and not checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeEnabled);
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should enable opa integration "enable by default" settings', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.opaOptions.enabled = true;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getOPAEnableCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that opa integration "enable by default" checkbox is enabled', () => {
    AdminSettings.DefaultsAndLimitsPage.getOPAEnableCheckbox().find('input').should(Condition.BeChecked);
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

  it('should make sure opa integration in wizard is enabled and checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeEnabled);
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should enable opa integration "enforce" settings', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.opaOptions.enforced = true;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getOPAEnforceCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that opa integration "enforce" checkbox is enabled', () => {
    AdminSettings.DefaultsAndLimitsPage.getOPAEnforceCheckbox().find('input').should(Condition.BeChecked);
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

  it('should make sure opa integration in wizard is disabled and checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeDisabled);
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should disable opa integration "enable by default" settings', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.opaOptions.enabled = false;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getOPAEnableCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that opa integration "enable by default" checkbox is disabled', () => {
    AdminSettings.DefaultsAndLimitsPage.getOPAEnableCheckbox().find('input').should(Condition.NotBeChecked);
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

  it('should make sure opa integration in wizard is disabled and not checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeDisabled);
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettings.DefaultsAndLimitsPage.visit();
  });

  it('should disable opa integration "enforce" settings', () => {
    if (Mocks.enabled()) {
      Mocks.adminSettings.opaOptions.enforced = false;
    } else {
      AdminSettings.DefaultsAndLimitsPage.getOPAEnforceCheckbox().click();
      AdminSettings.waitForSave();
    }
  });

  it('should verify that opa integration "enforce" checkbox is disabled', () => {
    AdminSettings.DefaultsAndLimitsPage.getOPAEnforceCheckbox().find('input').should(Condition.NotBeChecked);
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
