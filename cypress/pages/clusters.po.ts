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

import {wait} from '../utils/wait';
import {Condition} from '../utils/condition';
import {WizardPage} from './wizard.po';

export class ClustersPage {
  static getAddClusterBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-cluster-top-btn');
  }

  static getClusterItem(clusterName: string): Cypress.Chainable<any> {
    return cy.get(`#km-clusters-${clusterName}`);
  }

  static getDeleteClusterBtn(): Cypress.Chainable<any> {
    return cy.get('#km-delete-cluster-btn');
  }

  static getDeleteDialogInput(): Cypress.Chainable<any> {
    return cy.get('#km-delete-cluster-dialog-input');
  }

  static getDeleteDialogBtn(): Cypress.Chainable<any> {
    return cy.get('#km-delete-cluster-dialog-delete-btn');
  }

  static getTable(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static getTableRow(machineDeploymentName: string): Cypress.Chainable<any> {
    return this.getTableRowMachineDeploymentNameColumn(machineDeploymentName).parent();
  }

  static getTableRowMachineDeploymentNameColumn(machineDeploymentName: string): Cypress.Chainable<any> {
    return cy.get(`td#km-machine-deployment-${machineDeploymentName}`);
  }

  static getMachineDeploymentRemoveBtn(machineDeploymentName: string): Cypress.Chainable<any> {
    return this.getTableRow(machineDeploymentName).find('button i.km-icon-delete');
  }

  static getDeleteMachineDeploymentDialogBtn(): Cypress.Chainable<any> {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  static getMachineDeploymentList(timeout = 5000): Cypress.Chainable {
    return cy.get('km-machine-deployment-list', {timeout: timeout});
  }

  static getClusterName(): Cypress.Chainable {
    return cy.get('mat-card-title');
  }

  // Utils.

  static waitForRefresh(): void {
    wait('**/clusters', 'GET', 'list clusters');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'clusters');
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
