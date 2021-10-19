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
import {RequestType, Response, ResponseType, TrafficMonitor} from '../../../utils/monitor';
import {Endpoint} from '../../../utils/endpoint';

describe('Admin Settings - Administrators Story', () => {
  const userEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const adminEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const retries = 15;
  let adminsCount = 1;

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings - administrators view', () => {
    AdminSettings.AdministratorsPage.visit();
  });

  it('should have only one admin', () => {
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Administrators)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(adminsCount));
  });

  it('should add second admin', () => {
    AdminSettings.AdministratorsPage.getAddAdminBtn().click();
    AdminSettings.AdministratorsPage.getAddAdminDialogEmailInput()
      .type(userEmail)
      .should(Condition.HaveValue, userEmail);
    AdminSettings.AdministratorsPage.getAddAdminDialogSaveBtn().click();
    adminsCount++;
  });

  it('should have two admins', () => {
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Administrators)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(adminsCount));
  });

  it('should logout', () => {
    logout();
  });

  it('should login as second admin', () => {
    login(userEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings', () => {
    AdminSettings.AdministratorsPage.visit();
  });

  it('should logout', () => {
    logout();
  });

  it('should login as admin', () => {
    login(adminEmail, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should go to the admin settings', () => {
    AdminSettings.AdministratorsPage.visit();
  });

  it('should have two admins', () => {
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Administrators)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(adminsCount));
  });

  it('should remove second admin', () => {
    AdminSettings.AdministratorsPage.getDeleteAdminBtn(userEmail).click();
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
    adminsCount--;
  });

  it('should have only one admin', () => {
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Administrators)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(adminsCount));
  });

  it('should logout', () => {
    logout();
  });
});
