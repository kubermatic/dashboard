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

    static presetSelectBox() {
        return cy.get('.km-custom-credentials-select');
    }

    static presetVaultItem() {
        return cy.get('mat-option').contains('span', 'vault');
    }

    static nodeNameInput() {
        return cy.get('#km-node-name-input');
    }

    static nodeCountInput() {
        return cy.get('#km-node-count-input');
    }
}
