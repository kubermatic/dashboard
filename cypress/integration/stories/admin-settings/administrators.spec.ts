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

import {login, logout} from '../../../utils/auth';
import {Condition} from '../../../utils/condition';
import {View} from '../../../utils/view';
import {AdminSettings} from '../../../pages/admin-settings.po';
import {Config} from '../../../utils/config';
import {Mocks} from '../../../utils/mocks';

describe('Admin Settings - Administrators Story', () => {
  let adminsCount = 1;

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login as admin', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - administrators view', () => {
    AdminSettings.AdministratorsPage.visit();
  });

  it('should have only one admin', () => {
    AdminSettings.AdministratorsPage.verifyAdminCount(adminsCount);
  });

  it('should add second admin', () => {
    AdminSettings.AdministratorsPage.addAdmin(Config.userEmail());
    adminsCount++;
  });

  it('should have two admins', () => {
    AdminSettings.AdministratorsPage.verifyAdminCount(adminsCount);
  });

  it('should logout', () => {
    logout();
  });

  it('should login as second admin', () => {
    login(Config.userEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings', () => {
    AdminSettings.AdministratorsPage.visit();
  });

  it('should logout', () => {
    logout();
  });

  it('should login as admin', () => {
    login(Config.adminEmail(), Config.password(), true);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings', () => {
    AdminSettings.AdministratorsPage.visit();
  });

  it('should have two admins', () => {
    AdminSettings.AdministratorsPage.verifyAdminCount(adminsCount);
  });

  it('should remove second admin', () => {
    if (Mocks.enabled()) {
      const index = Mocks.administrators.findIndex(a => a.email === Config.userEmail);
      Mocks.administrators.splice(index, 1);
    } else {
      AdminSettings.AdministratorsPage.getDeleteAdminBtn(Config.userEmail()).click();
      cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
    }
    adminsCount--;
  });

  it('should have only one admin', () => {
    AdminSettings.AdministratorsPage.verifyAdminCount(adminsCount);
  });

  it('should logout', () => {
    logout();
  });
});
