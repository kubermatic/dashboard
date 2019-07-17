export class WizardPage {
  static nextBtn(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-next-btn');
  }

  static clusterNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-name-input');
  }

  static createBtn(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-create-btn');
  }

  static providerBtn(providerName: string): Cypress.Chainable<any> {
    return cy.get(`.km-provider-logo-${providerName}`);
  }

  static datacenterBtn(datacenterName: string): Cypress.Chainable<any> {
    return cy.get('button').contains('.km-location', datacenterName);
  }

  static customPresetsCombobox(): Cypress.Chainable<any> {
    return cy.get('.km-custom-credentials-select');
  }

  static customPresetsValue(presetName: string): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', presetName);
  }

  static nodeNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-node-name-input');
  }

  static nodeCountInput(): Cypress.Chainable<any> {
    return cy.get('#km-node-count-input');
  }
}
