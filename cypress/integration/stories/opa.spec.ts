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

import {AdminSettingsPage} from '../../pages/admin-settings.po';
import {ClustersPage} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Endpoint} from '../../utils/endpoint';
import {RequestType, TrafficMonitor} from '../../utils/monitor';
import {Preset} from '../../utils/preset';
import {Datacenter, Provider} from '../../utils/provider';
import {View} from '../../utils/view';
import {WizardStep} from '../../utils/wizard';
import * as _ from 'lodash';

describe('OPA Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');
  const initialMachineDeploymentName = _.uniqueId('e2e-test-md-');
  const initialMachineDeploymentReplicas = '1';
  const constraintTemplateName = 'k8srequiredlabels';
  const constraintTemplateSpec = atob(
    'Y3JkOg0KICBzcGVjOg0KICAgIG5hbWVzOg0KICAgICAga2luZDogSzhzUmVxdWlyZWRMYWJlbHMNCiAgICB2YWxpZGF0aW9uOg0KICAgICAgIyBTY2hlbWEgZm9yIHRoZSBgcGFyYW1ldGVyc2AgZmllbGQNCiAgICAgIG9wZW5BUElWM1NjaGVtYToNCiAgICAgICAgcHJvcGVydGllczoNCiAgICAgICAgICBsYWJlbHM6DQogICAgICAgICAgICB0eXBlOiBhcnJheQ0KICAgICAgICAgICAgaXRlbXM6IHN0cmluZw0KdGFyZ2V0czoNCiAgLSB0YXJnZXQ6IGFkbWlzc2lvbi5rOHMuZ2F0ZWtlZXBlci5zaA0KICAgIHJlZ286IHwNCiAgICAgIHBhY2thZ2UgazhzcmVxdWlyZWRsYWJlbHMNCg0KICAgICAgdmlvbGF0aW9uW3sibXNnIjogbXNnLCAiZGV0YWlscyI6IHsibWlzc2luZ19sYWJlbHMiOiBtaXNzaW5nfX1dIHsNCiAgICAgICAgcHJvdmlkZWQgOj0ge2xhYmVsIHwgaW5wdXQucmV2aWV3Lm9iamVjdC5tZXRhZGF0YS5sYWJlbHNbbGFiZWxdfQ0KICAgICAgICByZXF1aXJlZCA6PSB7bGFiZWwgfCBsYWJlbCA6PSBpbnB1dC5wYXJhbWV0ZXJzLmxhYmVsc1tfXX0NCiAgICAgICAgbWlzc2luZyA6PSByZXF1aXJlZCAtIHByb3ZpZGVkDQogICAgICAgIGNvdW50KG1pc3NpbmcpID4gMA0KICAgICAgICBtc2cgOj0gc3ByaW50ZigieW91IG11c3QgcHJvdmlkZSBsYWJlbHM6ICV2IiwgW21pc3NpbmddKQ0KICAgICAgfQ=='
  );
  const constraintName = 'e2e-test-constraint';
  const constraintSpec = atob(
    'bWF0Y2g6CiAga2luZHM6CiAgICAtIGFwaUdyb3VwczogWyIiXQogICAgICBraW5kczogWyJOYW1lc3BhY2UiXQpwYXJhbWV0ZXJzOgogIHJhd0pTT046ICd7ImxhYmVscyI6WyJnYXRla2VlcGVyIl19Jw=='
  );
  const gatekeeperConfig = atob(
    'c3luYzoKICBzeW5jT25seToKICAgIC0gZ3JvdXA6ICIiCiAgICAgIHZlcnNpb246ICJ2MSIKICAgICAga2luZDogIk5hbWVzcGFjZSIKICAgIC0gZ3JvdXA6ICIiCiAgICAgIHZlcnNpb246ICJ2MSIKICAgICAga2luZDogIlBvZCI='
  );

  it('should login', () => {
    login(email, password);

    cy.url().should(Condition.Include, View.Projects);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('should switch to opa constraint templates tab', () => {
    AdminSettingsPage.getOPAConstraintTemplatesTab().click();
  });

  it('should open add constraint template dialog', () => {
    AdminSettingsPage.getAddConstraintTemplateBtn().click();
  });

  it('should add a new constraint template', () => {
    AdminSettingsPage.getAddConstraintTemplateSpecTextarea()
      .click({force: true})
      .then($element => {
        const subString = constraintTemplateSpec.substr(0, constraintTemplateSpec.length - 1);
        const lastChar = constraintTemplateSpec.slice(-1);
        $element.text(subString);
        $element.val(subString);
        cy.get($element).type(lastChar);
      });

    AdminSettingsPage.getConstraintTemplateDialogSaveBtn().click();
  });

  it('should check if constraint template was created', () => {
    AdminSettingsPage.getConstraintTemplatesTable().should(Condition.Contain, constraintTemplateName);
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

  it('should create a new cluster with opa enabled', () => {
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Digitalocean.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getOPAIntegrationCheckbox().should(Condition.Exist);
    WizardPage.getOPAIntegrationCheckbox().find('input').click({force: true});
    WizardPage.getOPAIntegrationCheckbox().find('input').should(Condition.BeChecked);
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

    ClustersPage.verifyUrl();
  });

  it('should check if cluster was created', () => {
    ClustersPage.visit();
    ClustersPage.getTable().should(Condition.Contain, clusterName);
  });

  it('should go to cluster details page', () => {
    ClustersPage.getClusterItem(clusterName).click();
  });

  it('should verify that opa is enabled', () => {
    ClustersPage.getOPAInfoElement().find('i').should(Condition.HaveClass, 'km-icon-running');
  });

  it('should verify that the opa constraints tab is visible', () => {
    ClustersPage.getTabCard('OPA Constraints').should(Condition.Exist);
  });

  it('should verify that the opa gatekeeper config tab is visible', () => {
    ClustersPage.getTabCard('OPA Gatekeeper Config').should(Condition.Exist);
  });

  it('should wait for initial machine deployment to be created and healthy', () => {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.MachineDeployments).interceptAndWait();
    ClustersPage.getMachineDeploymentList().should(Condition.Contain, initialMachineDeploymentName);
    ClustersPage.getMachineDeploymentList().find('i').should(Condition.HaveClass, 'km-success-bg');
  });

  it('should switch to opa constraint tab', () => {
    ClustersPage.getTabCard('OPA Constraints').click();
  });

  it('should open add constraint dialog', () => {
    ClustersPage.getAddConstraintBtn().click();
  });

  it('should enter constraint name', () => {
    ClustersPage.getConstraintNameInput().type(constraintName).should(Condition.HaveValue, constraintName);
  });

  it('should select constraint template', () => {
    ClustersPage.getConstraintTemplateSelect().click();
    ClustersPage.getConstraintTemplateSelectOption(constraintTemplateName).click();
  });

  it('should enter constraint spec and add a new constraint', () => {
    ClustersPage.getAddConstraintSpecTextarea()
      .click({force: true})
      .then($element => {
        const subString = constraintSpec.substr(0, constraintSpec.length - 1);
        const lastChar = constraintSpec.slice(-1);
        $element.text(subString);
        $element.val(subString);
        cy.get($element).type(lastChar);
      });

    ClustersPage.getConstraintDialogSaveBtn().click();
  });

  it('should check if constraint was created', () => {
    ClustersPage.getConstraintTable().should(Condition.Contain, constraintName);
  });

  it('should delete created constraint', () => {
    ClustersPage.getDeleteConstraintBtn(constraintName).click();
    ClustersPage.getDeleteDialogConfirmButton().click();
  });

  it('should switch to opa gatekeeper config tab', () => {
    ClustersPage.getTabCard('OPA Gatekeeper Config').click();
  });

  it('should have add button, as no gatekeeper config is defined', () => {
    ClustersPage.getAddGatekeeperConfigBtn().should(Condition.Exist);
  });

  it('should open add gatekeeper config dialog', () => {
    ClustersPage.getAddGatekeeperConfigBtn().click();
  });

  it('should add gatekeeper config', () => {
    ClustersPage.getAddGatekeeperConfigTextarea()
      .click({force: true})
      .then($element => {
        const subString = gatekeeperConfig.substr(0, gatekeeperConfig.length - 1);
        const lastChar = gatekeeperConfig.slice(-1);
        $element.text(subString);
        $element.val(subString);
        cy.get($element).type(lastChar);
      });

    ClustersPage.getGatekeeperConfigDialogSaveBtn().click();
  });

  it('should check if gatekeeper config was created', () => {
    ClustersPage.getDeleteGatekeeperConfigBtn().should(Condition.Exist);
  });

  it('should delete gatekeeper config', () => {
    ClustersPage.getDeleteGatekeeperConfigBtn().click();
    ClustersPage.getDeleteDialogConfirmButton().click();
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

  it('should go to the admin settings', () => {
    AdminSettingsPage.visit();
  });

  it('should switch to opa constraint templates tab', () => {
    AdminSettingsPage.getOPAConstraintTemplatesTab().click();
  });

  it('should delete created constraint template', () => {
    AdminSettingsPage.getDeleteConstraintTemplateBtn(constraintTemplateName).click();
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  });

  it('should logout', () => {
    logout();
  });
});
