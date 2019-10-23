import Context = Mocha.Context;
import Done = Mocha.Done;

before(() => {
  cy.clearCookies();
});

beforeEach(() => {
  cy.server();
  Cypress.Cookies.preserveOnce('token', 'nonce');
});

afterEach(function (this: Context, done: Done): void {
  if (this.currentTest && this.currentTest.state === 'failed') {
    (Cypress as any).runner.stop();
  }

  done();
});
