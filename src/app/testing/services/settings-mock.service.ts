import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {AdminSettings, ClusterTypeOptions} from '../../shared/entity/AdminSettings';
import {UserSettings} from '../../shared/entity/MemberEntity';

export const DEFAULT_USER_SETTINGS_MOCK: UserSettings = {
  itemsPerPage: 10,
  selectProjectTableView: false,
  collapseSidenav: false,
};

export const DEFAULT_ADMIN_SETTINGS_MOCK: AdminSettings = {
  cleanupOptions: {
    Enforced: false,
    Enabled: false,
  },
  clusterTypeOptions: ClusterTypeOptions.All,
  customLinks: [],
  defaultNodeCount: 1,
  displayAPIDocs: true,
  displayDemoInfo: false,
  displayTermsOfService: false,
  enableDashboard: true,
  enableOIDCKubeconfig: false,
};

@Injectable()
export class SettingsMockService {
  get userSettings(): Observable<UserSettings> {
    return of(DEFAULT_USER_SETTINGS_MOCK);
  }

  get defaultUserSettings(): UserSettings {
    return DEFAULT_USER_SETTINGS_MOCK;
  }

  get adminSettings(): Observable<AdminSettings> {
    return of(DEFAULT_ADMIN_SETTINGS_MOCK);
  }

  get defaultAdminSettings(): AdminSettings {
    return DEFAULT_ADMIN_SETTINGS_MOCK;
  }

  refreshCustomLinks(): void {}
}
