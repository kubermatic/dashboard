export class WizardPage {
    static nextBtn() {
        return cy.get('#km-create-cluster-next-btn');
    }
    
    static clusterNameInput() {
        return cy.get('#km-create-cluster-name-input');
    }
    
    static createBtn() {
        return cy.get('#km-create-cluster-create-btn');
    }
    
    static providerBtn(providerName: string) {
        return cy.get(`.km-provider-logo-${providerName}`);
    }
    
    static datacenterBtn(datacenterName: string) {
        return cy.get('button').contains('.km-location', datacenterName);
    }
}
