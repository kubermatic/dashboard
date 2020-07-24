import {Condition} from '../utils/condition';
import {Endpoint} from '../utils/endpoint';
import {RequestType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';
import {UserPanel} from './user-panel.po';

export class UserSettingsPage {
  static getThemePicker(): Cypress.Chainable<any> {
    return cy.get('#km-theme-picker');
  }

  // Utils.

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Account);
  }

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.Settings).alias('get user settings').wait();
  }

  static visit(): void {
    UserPanel.openUserSettings();
    this.waitForRefresh();
    this.verifyUrl();
  }
}
