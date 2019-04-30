Cypress.on('fail', (error: any) => {
  (Cypress as any).runner.stop();
  throw error;
});
