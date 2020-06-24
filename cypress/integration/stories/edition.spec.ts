import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';

describe('Basic Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const kubermaticEdition = Cypress.env('KUBERMATIC_EDITION');
  const isEnterpriseEdition = kubermaticEdition === "ee";
  const expectedFooter = isEnterpriseEdition ? 'EnterpriseEdition' : 'Community Edition';

  it('should login', () => {
    login(email, password);

    cy.url().should(Condition.Include, 'projects');
  });

  it('should check if footer contains correct edition', () => {
    // todo check footer
  });

  it('should logout', () => {
    logout();
  });
});
