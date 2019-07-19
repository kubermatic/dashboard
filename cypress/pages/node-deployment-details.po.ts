export class NodeDeploymentDetailsPage {
  static getNodeDeploymentNameElement(): Cypress.Chainable<any> {
    return cy.get('.km-node-deployment-name');
  }

  static getNodeDeploymentClusterNameElement(): Cypress.Chainable<any> {
    return cy.get('.km-node-deployment-cluster-name');
  }

  static getBackToClusterBtn(): Cypress.Chainable<any> {
    return cy.get('.km-cluster-panel-icon');
  }
}
