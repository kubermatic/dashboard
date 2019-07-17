import {wait} from "../utils/wait";

export class ClustersPage {
    static visit() {
        cy.get('#km-nav-item-clusters').click();
        wait('**/clusters');
    }
    
    static addClusterBtn() {
        return cy.get('#km-add-cluster-top-btn');
    }
    
    static clusterItem(clusterName: string) {
        return cy.get(`#km-clusters-${clusterName}`);
    }
    
    static deleteClusterBtn() {
        return cy.get('#km-delete-cluster-btn');
    }
    
    static deleteDialogInput() {
        return cy.get('#km-delete-cluster-dialog-input');
    }
    
    static deleteDialogBtn() {
        return cy.get('#km-delete-cluster-dialog-delete-btn');
    }

    static table() {
        return cy.get('tbody');
    }

    static tableRow(nodeDeploymentName: string) {
        return ClustersPage.tableRowNodeDeploymentNameColumn(nodeDeploymentName).parent();
    }
    
    static tableRowNodeDeploymentNameColumn(nodeDeploymentName: string) {
        return cy.get('td').contains(nodeDeploymentName);
    }

    static nodeDeploymentItem(nodeDeploymentName: string) {
        return cy.get(`#nodeDeploymentName`);
    }

    static nodeDeploymentRemoveBtn(nodeDeploymentName: string) {
        return ClustersPage.tableRow(nodeDeploymentName).find('button i.km-icon-delete');
    }

    static deleteNodeDeploymentDialogBtn() {
        return cy.get('#km-confirmation-dialog-confirm-btn');
    }
}
