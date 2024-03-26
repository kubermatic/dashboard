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

import {Condition} from '../utils/condition';
import {Endpoint} from '../utils/endpoint';
import {Mocks} from '../utils/mocks';
import {RequestType, ResponseCheck, ResponseType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';
import {WizardPage} from './wizard.po';

export enum ProviderMenuOption {
  EditCluster = 'Edit Cluster',
  ManageSSHKeys = 'Manage SSH keys',
}

export class ClustersPage {
  static getProviderMenu(): Cypress.Chainable {
    return cy.get('.provider-menu-btn');
  }

  // TODO: Use our own IDs once https://github.com/angular/components/issues/4136 will be fixed.
  static getClustersTab(): Cypress.Chainable {
    return cy.get('#mat-mdc-tab-0-0');
  }

  static getExternalClustersTab(): Cypress.Chainable {
    return cy.get('#mat-mdc-tab-0-1');
  }

  static getAddClusterBtn(): Cypress.Chainable {
    return cy.get('#km-add-cluster-top-btn');
  }

  static getConnectClusterBtn(): Cypress.Chainable {
    return cy.get('#km-add-external-cluster-btn');
  }

  static getExternalClusterAnyProviderBtn(): Cypress.Chainable {
    return cy.get('#external-cluster-any-provider-btn');
  }

  static getConnectClusterNameInput(): Cypress.Chainable {
    return cy.get('#external-cluster-name-input');
  }

  static getConnectClusterSaveBtn(): Cypress.Chainable {
    return cy.get('#external-cluster-add-btn');
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
    return cy.get('.cluster-name');
  }

  static getClusterStatus(): Cypress.Chainable {
    return cy.get('.cluster-name').find('i.cluster-health');
  }

  static getProviderMenuButton(): Cypress.Chainable {
    return cy.get('.provider-menu-btn');
  }

  static getProviderMenuOption(option: ProviderMenuOption): Cypress.Chainable {
    return cy.get('.km-provider-edit-settings').contains('span', option).parent();
  }

  static getSSHKeysTable(): Cypress.Chainable {
    return cy.get('.content-edit-sshkeys').find('tbody');
  }

  static getSSHKeysTableRow(sshKeyName: string): Cypress.Chainable {
    return this.getSSHKeysTable().contains('td', sshKeyName).parent();
  }

  static getSSHKeysTableRemoveButton(sshKeyName: string): Cypress.Chainable {
    return this.getSSHKeysTableRow(sshKeyName).find('button i.km-icon-delete');
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

  static getOPAInfoElement(): Cypress.Chainable {
    return cy.get('#km-opa-info');
  }

  static getTabCard(title: string): Cypress.Chainable {
    return cy.get('#km-cluster-details-tab-card').find('div.mdc-tab__content').contains(title);
  }

  static getAddConstraintBtn(): Cypress.Chainable {
    return cy.get('#km-add-constraint-btn');
  }

  static getConstraintNameInput(): Cypress.Chainable {
    return cy.get('#km-constraint-name-input');
  }

  static getConstraintTemplateSelect(): Cypress.Chainable {
    return cy.get('#km-constraint-template-select');
  }

  static getConstraintTemplateSelectOption(name: string): Cypress.Chainable {
    return cy.get('#km-constraint-template-select').then(option => {
      if (option.find('mat-option').text(name).length > 0) {
        return cy.get('mat-option').contains(name);
      }

      return cy.get('mat-option');
    });
  }

  static getAddConstraintSpecTextarea(): Cypress.Chainable {
    return cy.get('km-constraint-dialog .monaco-editor textarea:first');
  }

  static getConstraintDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-constraint-dialog-btn');
  }

  static getDeleteConstraintBtn(name: string): Cypress.Chainable {
    return cy.get(`#km-constraint-delete-btn-${name}`);
  }

  static getConstraintTable(): Cypress.Chainable {
    return cy.get('km-constraint-list tbody');
  }

  static getAddGatekeeperConfigBtn(): Cypress.Chainable {
    return cy.get('#km-gatekeeper-config-add-btn');
  }

  static getAddGatekeeperConfigTextarea(): Cypress.Chainable {
    return cy.get('km-gatekeeper-config-dialog .monaco-editor textarea:first');
  }

  static getGatekeeperConfigDialogSaveBtn(): Cypress.Chainable {
    return cy.get('#km-gatekeeper-config-dialog-btn');
  }

  static getDeleteGatekeeperConfigBtn(): Cypress.Chainable {
    return cy.get('#km-gatekeeper-config-delete-btn');
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
    if (Mocks.enabled()) {
      cy.intercept({method: RequestType.GET, path: Endpoint.Clusters}, []);
    }

    this.waitForRefresh();
    this.verifyUrl();

    cy.get('div').should(Condition.Contain, 'No clusters available.');
  }

  static verifyNoExternalClusters(): void {
    if (Mocks.enabled()) {
      cy.intercept({method: RequestType.GET, path: Endpoint.ExternalClusters}, []);
    }

    this.waitForRefresh();
    this.verifyUrl();

    cy.get('div').should(Condition.Contain, 'No external clusters available.');
  }

  static verifyClustersCount(count: number): void {
    this.waitForRefresh();
    this.verifyUrl();

    const retries = 5;
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Clusters)
      .retry(retries)
      .expect(new ResponseCheck(ResponseType.LIST).elements(count));
  }

  static deleteCluster(name: string): void {
    this.getDeleteClusterBtn().click();
    this.getDeleteDialogInput().type(name).should(Condition.HaveValue, name);
    this.getDeleteDialogBtn().should(Condition.NotBe, 'disabled').click();
  }

  static verifyNoMachineDeployments(): void {
    if (Mocks.enabled()) {
      cy.intercept({method: RequestType.GET, path: Endpoint.MachineDeployments}, []);
    }

    this.verifyUrl();

    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.MachineDeployments).interceptAndWait();
    cy.get('div').should(Condition.Contain, 'No machine deployments available.');
  }

  static deleteMachineDeployment(name: string): void {
    this.getMachineDeploymentRemoveBtn(name).click();
    this.getDeleteDialogConfirmButton().click();
  }
}
