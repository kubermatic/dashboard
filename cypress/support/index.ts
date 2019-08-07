import Context = Mocha.Context;
import Done = Mocha.Done;

before(() => {
  cy.getCookie('has-failed-test').then(cookie => {
    if (cookie && typeof cookie === 'object' && cookie.value === 'true') {
      (Cypress as any).runner.stop();
    }
  });
});

afterEach(function (this: Context, done: Done): void {
  if (this.currentTest && this.currentTest.state === 'failed') {
    cy.setCookie('has-failed-test', 'true');
    (Cypress as any).runner.stop();
  }

  done.apply(this);
});
