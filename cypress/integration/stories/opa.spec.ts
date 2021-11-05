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
import {AdminSettings} from '../../pages/admin-settings.po';
import {ClustersPage} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Config} from '../../utils/config';
import {Mocks} from '../../utils/mocks';
import {Preset} from '../../utils/preset';
import {Datacenter, Provider} from '../../utils/provider';
import {View} from '../../utils/view';
import {WizardStep} from '../../utils/wizard';

describe('OPA Story', () => {
  const preset = Mocks.enabled() ? Preset.Mock : Preset.Digitalocean;
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('e2e-test-project-');
  const clusterName = Mocks.enabled() ? 'test-cluster' : _.uniqueId('e2e-test-cluster-');
  const initialMachineDeploymentName = Mocks.enabled() ? 'test-md' : _.uniqueId('e2e-test-md-');
  const initialMachineDeploymentReplicas = '1';
  const constraintTemplateName = 'k8srequiredlabels';
  const constraintTemplateSpec = 'constrainttemplate.spec.yaml';
  const constraintName = 'e2e-test-constraint';
  const constraintSpec = 'constraint.spec.yaml';
  const gatekeeperConfig = 'gatekeeperconfig.yaml';

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register(Provider.Digitalocean);
    }
  });

  it('should login', () => {
    login(Config.adminEmail(), Config.password(), true);

    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should go to the admin settings - opa page', () => {
    AdminSettings.OPAPage.visit();
  });

  it('should go to constraint templates tab', () => {
    AdminSettings.OPAPage.getTabCard('Constraint Templates').click();
  });

  it('should open add constraint template dialog', () => {
    AdminSettings.OPAPage.getAddConstraintTemplateBtn().click();
  });

  it('should add spec for a new constraint template', () => {
    AdminSettings.OPAPage.getAddConstraintTemplateSpecTextarea().click({force: true}).pasteFile(constraintTemplateSpec);
  });

  it('should add constraint template', () => {
    AdminSettings.OPAPage.getConstraintTemplateDialogSaveBtn().should(Condition.BeEnabled);
    AdminSettings.OPAPage.getConstraintTemplateDialogSaveBtn().click({force: true});
  });

  it('should check if constraint template was created', () => {
    AdminSettings.OPAPage.getConstraintTemplatesTable().should(Condition.Contain, constraintTemplateName);
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

  it('should wait for initial machine deployment to be created', () => {
    ClustersPage.getMachineDeploymentList().should(Condition.Contain, initialMachineDeploymentName);
  });

  it('should have healthy machine deployment', () => {
    ClustersPage.getMachineDeploymentList().find('i').should(Condition.HaveClass, 'km-success-bg');
  });

  it('should switch to opa constraint tab', () => {
    ClustersPage.getTabCard('OPA Constraints').should(Condition.Exist).click({force: true});
  });

  it('should open add constraint dialog', () => {
    ClustersPage.getAddConstraintBtn().should(Condition.Exist).click();
  });

  it('should enter constraint name', () => {
    ClustersPage.getConstraintNameInput().type(constraintName).should(Condition.HaveValue, constraintName);
  });

  it('should select constraint template', () => {
    ClustersPage.getConstraintTemplateSelect().click();
    ClustersPage.getConstraintTemplateSelectOption(constraintTemplateName).click();
  });

  it('should enter constraint spec', () => {
    ClustersPage.getAddConstraintSpecTextarea().click({force: true}).pasteFile(constraintSpec);
  });

  it('should add constraint', () => {
    ClustersPage.getConstraintDialogSaveBtn().should(Condition.BeEnabled);
    ClustersPage.getConstraintDialogSaveBtn().click({force: true});
  });

  it('should check if constraint was created', () => {
    ClustersPage.getConstraintTable().should(Condition.Contain, constraintName);
  });

  it('should delete created constraint', () => {
    ClustersPage.getDeleteConstraintBtn(constraintName).click();
    ClustersPage.getDeleteDialogConfirmButton().click();
  });

  it('should switch to opa gatekeeper config tab', () => {
    ClustersPage.getTabCard('OPA Gatekeeper Config').should(Condition.Exist).click({force: true});
  });

  it('should have add button, as no gatekeeper config is defined', () => {
    ClustersPage.getAddGatekeeperConfigBtn().should(Condition.Exist);
  });

  it('should open add gatekeeper config dialog', () => {
    ClustersPage.getAddGatekeeperConfigBtn().click();
  });

  it('should add gatekeeper spec', () => {
    ClustersPage.getAddGatekeeperConfigTextarea().click({force: true}).pasteFile(gatekeeperConfig);
  });

  it('should add gatekeeper config', () => {
    if (Mocks.enabled()) {
      Mocks.gatekeeperConfig = cy.readFile('cypress/fixtures/gatekeeperconfig.json');
    }
    ClustersPage.getGatekeeperConfigDialogSaveBtn().should(Condition.BeEnabled);
    ClustersPage.getGatekeeperConfigDialogSaveBtn().click({force: true});
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
    ProjectsPage.verifyNoProjects();
  });

  it('should go to the admin settings', () => {
    AdminSettings.OPAPage.visit();
  });

  it('should go to constraint templates tab', () => {
    AdminSettings.OPAPage.getTabCard('Constraint Templates').click();
  });

  it('should delete created constraint template', () => {
    AdminSettings.OPAPage.getDeleteConstraintTemplateBtn(constraintTemplateName).click();
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  });

  it('should logout', () => {
    logout();
  });
});
