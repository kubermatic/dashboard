import {Condition} from "../utils/condition";

export class WizardPage {
  static getNextBtn(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-next-btn');
  }

  static getClusterNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-name-input');
  }

  static getCreateBtn(): Cypress.Chainable<any> {
    return cy.get('#km-create-cluster-create-btn');
  }

  static getProviderBtn(providerName: string): Cypress.Chainable<any> {
    return cy.get(`.km-provider-logo-${providerName}`);
  }

  static getDatacenterBtn(datacenterName: string): Cypress.Chainable<any> {
    return cy.get('button').contains('.km-location', datacenterName);
  }

  static getCustomPresetsCombobox(): Cypress.Chainable<any> {
    return cy.get('.km-custom-credentials-select');
  }

  static getCustomPresetsValue(presetName: string): Cypress.Chainable<any> {
    return cy.get('mat-option').contains('span', presetName);
  }

  static getNodeNameInput(): Cypress.Chainable<any> {
    return cy.get('#km-node-name-input');
  }

  static getNodeCountInput(): Cypress.Chainable<any> {
    return cy.get('#km-node-count-input');
  }

  // Utils.

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'wizard');
  }
}
