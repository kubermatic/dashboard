before(() => {
  cy.getCookie('has-failed-test').then(cookie => {
    if (cookie && typeof cookie === 'object' && cookie.value === 'true') {
      (Cypress as any).runner.stop();
    }
  });
});

afterEach(function (): void {
  if (this.currentTest.state === 'failed') {
    cy.setCookie('has-failed-test', 'true');
    (Cypress as any).runner.stop();
  }
});
