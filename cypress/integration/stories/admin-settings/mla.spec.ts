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
import {AdminSettingsPage} from '../../../pages/admin-settings.po';
import {ClustersPage} from '../../../pages/clusters.po';
import {ProjectsPage} from '../../../pages/projects.po';
import {WizardPage} from '../../../pages/wizard.po';
import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {Endpoint} from '../../../utils/endpoint';
import {RequestType, TrafficMonitor} from '../../../utils/monitor';
import {Datacenter, Provider} from '../../../utils/provider';
import {View} from '../../../utils/view';

describe('Admin Settings - MLA Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('should make sure mla logging enable settings is not checked', () => {
    AdminSettingsPage.getMLALoggingEnableCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should make sure mla logging enforce settings is not checked', () => {
    AdminSettingsPage.getMLALoggingEnforceCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should make sure mla monitoring enable settings is not checked', () => {
    AdminSettingsPage.getMLAMonitoringEnableCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should make sure mla monitoring enforce settings is not checked', () => {
    AdminSettingsPage.getMLAMonitoringEnforceCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should go to projects view', () => {
    ProjectsPage.visit();
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

  it('should make sure mla logging + mla monitoring in wizard is enabled and not checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeEnabled);
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.NotBeChecked);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeEnabled);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it("should enable mla logging 'enable by default' settings", () => {
    AdminSettingsPage.getMLALoggingEnableCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLALoggingEnableCheckbox().find('input').should(Condition.BeChecked);
  });

  it("should enable mla monitoring 'enable by default' settings", () => {
    AdminSettingsPage.getMLAMonitoringEnableCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLAMonitoringEnableCheckbox().find('input').should(Condition.BeChecked);
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

  it('should make sure mla logging + mla monitoring in wizard is enabled and checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.SeedSettings).interceptAndWait();
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeEnabled);
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeChecked);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeEnabled);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it("should enable mla logging 'enforce' settings", () => {
    AdminSettingsPage.getMLALoggingEnforceCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLALoggingEnforceCheckbox().find('input').should(Condition.BeChecked);
  });

  it("should enable mla monitoring 'enforce' settings", () => {
    AdminSettingsPage.getMLAMonitoringEnforceCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLAMonitoringEnforceCheckbox().find('input').should(Condition.BeChecked);
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

  it('should make sure mla logging + mla monitoring in wizard is disabled and checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.SeedSettings).interceptAndWait();
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeDisabled);
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeChecked);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeDisabled);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it("should disable mla logging 'enable by default' settings", () => {
    AdminSettingsPage.getMLALoggingEnableCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLALoggingEnableCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it("should disable mla monitoring 'enable by default' settings", () => {
    AdminSettingsPage.getMLAMonitoringEnableCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLAMonitoringEnableCheckbox().find('input').should(Condition.NotBeChecked);
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

  it('should make sure mla logging + mla monitoring in wizard is disabled and checked', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.SeedSettings).interceptAndWait();
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeDisabled);
    WizardPage.getMLALoggingCheckbox().find('input').should(Condition.BeChecked);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeDisabled);
    WizardPage.getMLAMonitoringCheckbox().find('input').should(Condition.BeChecked);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('should restore default mla logging settings', () => {
    AdminSettingsPage.getMLALoggingEnforceCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLALoggingEnforceCheckbox().find('input').should(Condition.NotBeChecked);
  });

  it('should restore default mla monitoring settings', () => {
    AdminSettingsPage.getMLAMonitoringEnforceCheckbox().click();
    AdminSettingsPage.waitForSave();
    AdminSettingsPage.getMLAMonitoringEnforceCheckbox().find('input').should(Condition.NotBeChecked);
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
