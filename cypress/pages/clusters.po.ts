import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";

export class ClustersPage {
  static addClusterBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-cluster-top-btn');
  }

  static clusterItem(clusterName: string): Cypress.Chainable<any> {
    return cy.get(`#km-clusters-${clusterName}`);
  }

  static deleteClusterBtn(): Cypress.Chainable<any> {
    return cy.get('#km-delete-cluster-btn');
  }

  static deleteDialogInput(): Cypress.Chainable<any> {
    return cy.get('#km-delete-cluster-dialog-input');
  }

  static deleteDialogBtn(): Cypress.Chainable<any> {
    return cy.get('#km-delete-cluster-dialog-delete-btn');
  }

  static table(): Cypress.Chainable<any> {
    return cy.get('tbody');
  }

  static tableRow(nodeDeploymentName: string): Cypress.Chainable<any> {
    return ClustersPage.tableRowNodeDeploymentNameColumn(nodeDeploymentName).parent();
  }

  static tableRowNodeDeploymentNameColumn(nodeDeploymentName: string): Cypress.Chainable<any> {
    return cy.get('td').contains(nodeDeploymentName);
  }

  static nodeDeploymentRemoveBtn(nodeDeploymentName: string): Cypress.Chainable<any> {
    return ClustersPage.tableRow(nodeDeploymentName).find('button i.km-icon-delete');
  }

  static deleteNodeDeploymentDialogBtn(): Cypress.Chainable<any> {
    return cy.get('#km-confirmation-dialog-confirm-btn');
  }

  static waitForRefresh(): void {
    wait('**/clusters', 'GET', 'list clusters');
  }

  static visit(): void {
    cy.get('#km-nav-item-clusters').click();
    cy.url().should(Condition.Include, 'clusters');
    this.waitForRefresh();
  }
}
