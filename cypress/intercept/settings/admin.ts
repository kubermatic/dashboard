import {Endpoints, Fixtures} from '@kmtypes';
import {AdminSettings as SettingsSpec} from '../../../src/app/shared/entity/settings';

export class AdminSettings {
  private static _adminSettingsFixture = Fixtures.Settings.Admin;

  constructor() {
    cy.intercept(Endpoints.Administrator.Settings, req => req.reply({body: AdminSettings._adminSettingsFixture}));
  }

  onChange(settings: Partial<SettingsSpec>): void {
    AdminSettings._adminSettingsFixture = {...AdminSettings._adminSettingsFixture, ...settings};
  }
}
