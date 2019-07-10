export function wait(apiURL: string, method = 'GET', alias = 'wait', timeout?: number) {
    cy.route(method, apiURL).as(alias);
    return !!timeout ? cy.wait(`@${alias}`, {timeout: timeout}) : cy.wait(`@${alias}`);
}
