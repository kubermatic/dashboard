export function wait(apiURL: string, method = 'GET', alias = 'wait', timeout?: number): Cypress.Chainable<any> {
  cy.route(method, apiURL).as(alias);
  return !!timeout ? cy.wait(`@${alias}`, {timeout}) : cy.wait(`@${alias}`);
}
