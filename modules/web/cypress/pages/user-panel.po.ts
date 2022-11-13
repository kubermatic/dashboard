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

export class UserPanel {
  static getUserPanelMenuBtn(): Cypress.Chainable {
    return cy.get('#km-navbar-user-menu');
  }

  static getLogoutBtn(): Cypress.Chainable {
    return cy.get('#km-navbar-logout-btn');
  }

  static getUserSettingsBtn(): Cypress.Chainable {
    return cy.get('#km-navbar-user-settings-btn');
  }

  static getAdminSettingsBtn(): Cypress.Chainable {
    return cy.get('#km-navbar-admin-settings-btn');
  }

  // Utils.

  static open(): void {
    this.getUserPanelMenuBtn().click();
  }

  static logout(): void {
    this.open();
    this.getLogoutBtn().click();
  }
}
