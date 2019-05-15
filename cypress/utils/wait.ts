export function wait(apiURL: string, method = 'GET', alias = 'wait') {
    cy.route(method, apiURL).as(alias);
    return cy.wait(`@${alias}`);
}
