import Chainable = Cypress.Chainable;
import WaitXHR = Cypress.WaitXHR;

export function wait(apiURL: string, method = 'GET', alias = 'wait', timeout?: number): Chainable<WaitXHR> {
    cy.route(method, apiURL).as(alias);
    return !!timeout ? cy.wait(`@${alias}`, {timeout}) : cy.wait(`@${alias}`);
}
