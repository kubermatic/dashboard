// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Endpoints, Fixtures, RequestType} from '@kmtypes';
import {AdminSettings as SettingsSpec} from '../../../src/app/shared/entity/settings';

export class AdminSettings {
  private static _adminSettingsFixture = Fixtures.Settings.Admin;
  private static _dynamicDatacentersFixture = Fixtures.Settings.DatacenterList;

  constructor() {
    cy.intercept(Endpoints.Administrator.Settings, req => req.reply({body: AdminSettings._adminSettingsFixture})).as(
      'getAdminSettings'
    );
    cy.intercept(RequestType.GET, Endpoints.Resource.Datacenter.List, req =>
      req.reply({fixture: AdminSettings._dynamicDatacentersFixture})
    ).as('getDatacenters');
    cy.intercept(RequestType.POST, Endpoints.Resource.Datacenter.Create, req =>
      req.reply({fixture: Fixtures.Settings.Datacenter})
    ).as('createDatacenter');
    cy.intercept(RequestType.DELETE, Endpoints.Resource.Datacenter.Delete, req =>
      req.reply({fixture: Fixtures.Settings.Datacenter})
    ).as('deleteDatacenter');
  }

  onChange(settings: Partial<SettingsSpec>): void {
    AdminSettings._adminSettingsFixture = {...AdminSettings._adminSettingsFixture, ...settings};
  }

  onDatacenterDelete(): void {
    AdminSettings._dynamicDatacentersFixture = Fixtures.EmptyArray;
  }
}
