import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {UserSettingsPage} from '../../pages/user-settings.po';

describe('Edition Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const kubermaticEdition = Cypress.env('KUBERMATIC_EDITION');
  const isEnterpriseEdition = kubermaticEdition === 'ee';
  const editionName = isEnterpriseEdition ? 'Enterprise Edition' : 'Community Edition';

  it('should login', () => {
    login(email, password);

    cy.url().should(Condition.Include, 'projects');
  });

  it('should check if footer contains correct edition', () => {
    cy.get('#km-edition').should(Condition.Contain, editionName);
  });

  it('should go to the user settings', () => {
    UserSettingsPage.visit();
  });

  it('should check if theme picker is available', () => {
    UserSettingsPage.getThemePicker().should(isEnterpriseEdition ? Condition.Exist : Condition.NotExist;);
  });

  it('should logout', () => {
    logout();
  });
});
