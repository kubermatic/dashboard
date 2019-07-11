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

    static digitaloceanTokenInput() {
        return cy.get('#km-digitalocean-token-input');
    }

    static customPresetsCombobox() {
        return cy.get('.km-custom-credentials-select');
    }

    static customPresetsValue(presetName: string) {
        return cy.get('mat-option').contains('span', presetName);
    }

    static nodeNameInput() {
        return cy.get('#km-node-name-input');
    }

    static nodeCountInput() {
        return cy.get('#km-node-count-input');
    }
}
