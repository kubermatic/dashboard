export class MachineDeploymentDetailsPage {
  static getMachineDeploymentNameElement(): Cypress.Chainable<any> {
    return cy.get('.km-machine-deployment-name');
  }

  static getMachineDeploymentClusterNameElement(): Cypress.Chainable<any> {
    return cy.get('.km-machine-deployment-cluster-name');
  }

  static getBackToClusterBtn(): Cypress.Chainable<any> {
    return cy.get('.km-cluster-panel-icon');
  }
}
