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
import {MachineDeploymentDetailsPage} from '../../pages/machine-deployment-details.po';
import {ProjectsPage} from '../../pages/projects.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Datacenter, Provider} from '../../utils/provider';
import {prefixedString} from '../../utils/random';
import {wait} from '../../utils/wait';

describe('Machine Deployments Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = prefixedString('e2e-test-project');
  const clusterName = prefixedString('e2e-test-cluster');
  const initialMachineDeploymentName = prefixedString('e2e-test-md');
  const initialMachineDeploymentReplicas = '1';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, 'projects');
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
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn().click();
    WizardPage.getProviderBtn(Provider.Digitalocean).click();
    WizardPage.getDatacenterBtn(Datacenter.Frankfurt).click();
    WizardPage.getCustomPresetsCombobox().click();
    WizardPage.getCustomPresetsValue('e2e-digitalocean').click();
    wait('**/providers/digitalocean/sizes');
    WizardPage.getNodeNameInput()
      .type(initialMachineDeploymentName)
      .should(Condition.HaveValue, initialMachineDeploymentName);
    WizardPage.getNodeCountInput()
      .clear()
      .type(initialMachineDeploymentReplicas)
      .should(Condition.HaveValue, initialMachineDeploymentReplicas);
    WizardPage.getNextBtn().click();
    WizardPage.getCreateBtn().click();

    cy.url().should(Condition.Contain, '/clusters');
  });

  it('should check if cluster was created', () => {
    ClustersPage.visit();
    ClustersPage.getTable().should(Condition.Contain, clusterName);
  });

  it('should go to cluster details page', () => {
    ClustersPage.getClusterItem(clusterName).click();
  });

  it('should wait for initial machine deployment to be created', () => {
    wait('**/nodedeployments', 'GET', 'getMachineDeployments', 900000);
    cy.get('km-machine-deployment-list', {timeout: 900000}).should(Condition.Contain, initialMachineDeploymentName);
  });

  it('should go to machine deployment details', () => {
    ClustersPage.getTableRowMachineDeploymentNameColumn(initialMachineDeploymentName).click();
  });

  it('should verify machine deployment name', () => {
    MachineDeploymentDetailsPage.getMachineDeploymentNameElement().should(
      Condition.Contain,
      initialMachineDeploymentName
    );
  });

  it('should verify machine deployment cluster name', () => {
    MachineDeploymentDetailsPage.getMachineDeploymentClusterNameElement().should(Condition.Contain, clusterName);
  });

  it('should go back to cluster details page and remove initial machine deployment', () => {
    MachineDeploymentDetailsPage.getBackToClusterBtn().click();
    cy.url().should(Condition.Contain, '/clusters');
    cy.get('mat-card-title').should(Condition.Contain, clusterName);
    cy.get('km-machine-deployment-list').should(Condition.Contain, initialMachineDeploymentName);

    ClustersPage.getMachineDeploymentRemoveBtn(initialMachineDeploymentName).click();
    ClustersPage.getDeleteMachineDeploymentDialogBtn().click();
    ClustersPage.getTableRowMachineDeploymentNameColumn(initialMachineDeploymentName).should(Condition.NotExist);
  });

  it('should delete created cluster', () => {
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

  it('should logout', () => {
    logout();
  });
});
