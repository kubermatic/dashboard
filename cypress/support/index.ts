before(() => {
  cy.clearCookies();
});

beforeEach(() => {
  cy.server();
  Cypress.Cookies.preserveOnce('token', 'nonce');
});
