// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {AdminSettings, UserSettings} from '@shared/entity/settings';

export const DEFAULT_USER_SETTINGS_MOCK: UserSettings = {
  itemsPerPage: 10,
  selectProjectTableView: false,
  collapseSidenav: false,
};

export const DEFAULT_ADMIN_SETTINGS_MOCK: AdminSettings = {
  cleanupOptions: {
    enforced: false,
    enabled: false,
  },
  customLinks: [],
  defaultNodeCount: 1,
  displayAPIDocs: true,
  displayDemoInfo: false,
  displayTermsOfService: false,
  enableDashboard: true,
  enableOIDCKubeconfig: false,
  userProjectsLimit: 0,
  restrictProjectCreation: false,
  enableExternalClusterImport: true,
  machineDeploymentVMResourceQuota: {
    minRAM: 0,
    maxRAM: 0,
    minCPU: 0,
    maxCPU: 0,
    enableGPU: false,
  },
  opaOptions: {
    enforced: false,
    enabled: false,
  },
  mlaOptions: {
    loggingEnforced: false,
    loggingEnabled: false,
    monitoringEnforced: false,
    monitoringEnabled: false,
  },
  mlaAlertmanagerPrefix: '',
  mlaGrafanaPrefix: '',
};

@Injectable()
export class SettingsMockService {
  get adminSettings(): Observable<AdminSettings> {
    return of(DEFAULT_ADMIN_SETTINGS_MOCK);
  }

  get defaultAdminSettings(): AdminSettings {
    return DEFAULT_ADMIN_SETTINGS_MOCK;
  }

  refreshCustomLinks(): void {}
}
