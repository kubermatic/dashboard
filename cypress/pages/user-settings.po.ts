import {wait} from '../utils/wait';
import {Condition} from '../utils/condition';
import {UserPanel} from './user-panel.po';

export class UserSettingsPage {
  static getThemePicker(): Cypress.Chainable<any> {
    return cy.get('#km-theme-picker');
  }

  // Utils.

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'account');
  }

  static waitForRefresh(): void {
    wait('**/me/settings', 'GET', 'get user settings');
  }

  static visit(): void {
    UserPanel.openUserSettings();
    this.waitForRefresh();
    this.verifyUrl();
  }
}
