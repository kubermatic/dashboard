import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";
import {WizardPage} from "./wizard.po";

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

  static getTableRow(nodeDeploymentName: string): Cypress.Chainable<any> {
    return this.getTableRowNodeDeploymentNameColumn(nodeDeploymentName).parent();
  }

  static getTableRowNodeDeploymentNameColumn(nodeDeploymentName: string): Cypress.Chainable<any> {
    return cy.get('td').contains(nodeDeploymentName);
  }

  static getNodeDeploymentRemoveBtn(nodeDeploymentName: string): Cypress.Chainable<any> {
    return this.getTableRow(nodeDeploymentName).find('button i.km-icon-delete');
  }

  static getDeleteNodeDeploymentDialogBtn(): Cypress.Chainable<any> {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  // Utils.

  static waitForRefresh(): void {
    wait('**/clusters', 'GET', 'list clusters');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'clusters');
  }

  static visit(): void {
    cy.get('#km-nav-item-clusters').click();
    this.waitForRefresh();
    this.verifyUrl();
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
