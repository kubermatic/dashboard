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

import {Condition} from '../utils/condition';
import {Endpoint} from '../utils/endpoint';
import {RequestType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';
import {WizardPage} from './wizard.po';

export enum ProviderMenuOption {
  EditCluster = 'Edit Cluster',
  ManageSSHKeys = 'Manage SSH keys',
}

export class ClustersPage {
  static getAddClusterBtn(): Cypress.Chainable {
    return cy.get('#km-add-cluster-top-btn');
  }

  static getConnectClusterBtn(): Cypress.Chainable {
    return cy.get('#km-connect-cluster-top-btn');
  }

  static getConnectClusterNameInput(): Cypress.Chainable {
    return cy.get('#external-cluster-name-input');
  }

  static getConnectClusterSaveBtn(): Cypress.Chainable {
    return cy.get('#external-cluster-confirm-btn');
  }

  static getPrimaryLabel(): Cypress.Chainable {
    return cy.get('span.km-label-primary');
  }

  static getConnectClusterKubeconfigTextarea(): Cypress.Chainable {
    return cy.get('.monaco-editor textarea:first');
  }

  static getClusterItem(clusterName: string): Cypress.Chainable {
    return cy.get(`#km-clusters-${clusterName}`);
  }

  static getDeleteClusterBtn(): Cypress.Chainable {
    return cy.get('#km-delete-cluster-btn');
  }

  static getDisconnectConfirmBtn(): Cypress.Chainable {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  static getDeleteDialogInput(): Cypress.Chainable {
    return cy.get('#km-delete-cluster-dialog-input');
  }

  static getDeleteDialogBtn(): Cypress.Chainable {
    return cy.get('#km-delete-cluster-dialog-delete-btn');
  }

  static getTable(): Cypress.Chainable {
    return cy.get('tbody');
  }

  static getTableRow(machineDeploymentName: string): Cypress.Chainable {
    return this.getTableRowMachineDeploymentNameColumn(machineDeploymentName).parent();
  }

  static getTableRowMachineDeploymentNameColumn(machineDeploymentName: string): Cypress.Chainable {
    return cy.get(`td#km-machine-deployment-${machineDeploymentName}`);
  }

  static getMachineDeploymentRemoveBtn(machineDeploymentName: string): Cypress.Chainable {
    return this.getTableRow(machineDeploymentName).find('button i.km-icon-delete');
  }

  static getDeleteDialogConfirmButton(): Cypress.Chainable {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  static getMachineDeploymentList(): Cypress.Chainable {
    return cy.get('km-machine-deployment-list');
  }

  static getClusterName(): Cypress.Chainable {
    return cy.get('.km-cluster-name');
  }

  static getClusterStatus(): Cypress.Chainable {
    return cy.get('.km-cluster-name').find('i.km-cluster-health');
  }

  static getProviderMenuButton(): Cypress.Chainable {
    return cy.get('.km-provider-menu-btn');
  }

  static getProviderMenuOption(option: ProviderMenuOption): Cypress.Chainable {
    return cy.get('.km-provider-edit-settings').contains('span', option).parent();
  }

  static getSSHKeysTable(): Cypress.Chainable {
    return cy.get('.km-content-edit-sshkeys').find('tbody');
  }

  static getSSHKeysTableRow(sshKeyName: string): Cypress.Chainable {
    return this.getSSHKeysTable().contains('td', sshKeyName).parent();
  }

  static getSSHKeysTableRemoveButton(sshKeyName: string): Cypress.Chainable {
    return this.getSSHKeysTableRow(sshKeyName).find('button i.km-icon-delete');
  }

  static getSSHKeysAddDropdown(): Cypress.Chainable {
    return cy.get('.km-edit-sshkeys-dropdown').should(Condition.NotHaveClass, 'mat-form-field-disabled');
  }

  static getSSHKeysDropdownOption(name: string): Cypress.Chainable {
    return cy.get('.km-add-dialog-dropdown').find('mat-option').contains('span', name);
  }

  static getDialogCloseButton(): Cypress.Chainable {
    return cy.get('#km-close-dialog-btn');
  }

  static getDeleteDialogCleanupLBCheckbox(): Cypress.Chainable {
    return cy.get('#km-delete-cluster-lb-cleanup');
  }

  static getDeleteDialogCleanupVolumeCheckbox(): Cypress.Chainable {
    return cy.get('#km-delete-cluster-volume-cleanup');
  }

  static getOpenKubernetesDashboardButton(): Cypress.Chainable {
    return cy.get('#km-open-kubernetes-dashboard-btn');
  }

  static getShareKubeconfigButton(): Cypress.Chainable {
    return cy.get('#km-share-kubeconfig-btn');
  }

  // Utils.

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().url(Endpoint.Clusters).method(RequestType.GET).interceptAndWait();
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Clusters.Default);
  }

  static verifyExternalClustersUrl(): void {
    cy.url().should(Condition.Include, View.Clusters.External);
  }

  static visit(): void {
    cy.get('#km-nav-item-clusters')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static openWizard(): void {
    this.getAddClusterBtn().click();
    WizardPage.verifyUrl();
  }

  static verifyNoClusters(): void {
    this.waitForRefresh();
    this.verifyUrl();
    cy.get('div').should(Condition.Contain, 'No clusters available.');
  }

  static deleteCluster(name: string): void {
    this.getDeleteClusterBtn().click();
    this.getDeleteDialogInput().type(name).should(Condition.HaveValue, name);
    this.getDeleteDialogBtn().should(Condition.NotBe, 'disabled').click();
    this.waitForRefresh();
    this.getTable().should(Condition.NotContain, name);
  }
}
