export class NodeDeploymentDetailsPage {
  static nodeDeploymentNameElement(): Cypress.Chainable<any> {
    return cy.get('.km-node-deployment-name');
  }

  static nodeDeploymentClusterNameElement(): Cypress.Chainable<any> {
    return cy.get('.km-node-deployment-cluster-name');
  }

  static backToClusterBtn(): Cypress.Chainable<any> {
    return cy.get('.km-cluster-panel-icon');
  }
}
