// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DexPage} from '../pages/dex.po';
import {LoginPage} from '../pages/login.po';
import {Condition} from './condition';
import {ProjectsPage} from '../pages/projects.po';
import {UserPanel} from '../pages/user-panel.po';
import {Mocks} from './mocks';

export function login(
  email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME'),
  password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD')
): void {
  if (Mocks.enabled()) {
    mockLogin();
  } else {
    doLogin(email, password);
  }
}

export function logout(): void {
  UserPanel.logout();
}

function doLogin(email: string, password: string): void {
  LoginPage.visit();
  LoginPage.getLoginBtn().click();

  DexPage.getLoginPanel().then(element => {
    if (DexPage.hasLoginWithEmailBtn(element)) {
      DexPage.getLoginWithEmailBtn().click();
    }
  });

  DexPage.getLoginInput().type(email).should(Condition.HaveValue, email);
  DexPage.getPasswordInput().type(password).should(Condition.HaveValue, password);
  DexPage.getLoginBtn().click();

  ProjectsPage.waitForRefresh();
}

function mockLogin(): void {
  mockAuthCookies();

  cy.visit('/projects');
}

function mockAuthCookies(): void {
  const radix = 36;
  const slice = 2;
  const day = 8640000;
  const nonce = Math.random().toString(radix).slice(slice);
  const header = {alg: 'RS256', typ: 'JWT'};
  const payload = {
    iss: 'http://dex.oauth:5556/dex/auth',
    sub: btoa(Math.random().toString(radix).slice(slice)),
    aud: 'kubermatic',
    exp: Date.now() + day,
    iat: Date.now(),
    nonce: nonce,
    email: 'roxy@kubermatic.io',
    email_verified: true,
    name: 'roxy',
  };
  const signature = Math.random().toString(radix).slice(slice);
  const token =
    btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.' + btoa(JSON.stringify(signature));

  cy.setCookie('token', token);
  cy.setCookie('nonce', nonce);
  cy.setCookie('autoredirect', 'false');
}
