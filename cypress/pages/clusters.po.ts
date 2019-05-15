export class ClustersPage {
    static visit() {
        cy.get('#km-nav-item-clusters').click();
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
}
