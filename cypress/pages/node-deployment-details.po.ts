export class NodeDeploymentDetailsPage {
    static nodeDeploymentNameElement() {
        return cy.get('.km-node-deployment-name');
    }
    
    static nodeDeploymentClusterNameElement() {
        return cy.get('.km-node-deployment-cluster-name');
    }
}
