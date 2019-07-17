export class NodeDeploymentDetailsPage {
  static nodeDeploymentNameElement() {
    return cy.get('.km-node-deployment-name');
  }

  static nodeDeploymentClusterNameElement() {
    return cy.get('.km-node-deployment-cluster-name');
  }

  static backToClusterBtn() {
    return cy.get('.km-cluster-panel-icon');
  }
}
