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

import {Endpoint} from '../../../../utils/endpoint';
import {Mocks} from '../../../../utils/mocks';
import {LoginStrategy} from './types';

export class MockedLoginStrategy implements LoginStrategy {
  private static _userFixture = {
    id: 'user-j9e03',
    name: 'roxy',
    creationTimestamp: new Date(),
    isAdmin: false,
    email: 'roxy@kubermatic.io',
    projects: [
      {
        id: 'fn9234fn1d',
        group: 'owners',
      },
    ],
    userSettings: {
      itemsPerPage: 5,
      lastSeenChangelogVersion: 'v9.0.0',
      selectedProjectID: '',
      selectProjectTableView: true,
    },
  };

  constructor() {
    this._init();
  }

  login(email: string, _: string, isAdmin: boolean): void {
    MockedLoginStrategy._userFixture.email = email;
    MockedLoginStrategy._userFixture.name = email.split('@')[0];
    MockedLoginStrategy._userFixture.isAdmin = isAdmin;

    this._mockAuthCookies();
  }

  private _mockAuthCookies(): void {
    const radix = 36;
    const slice = 2;
    const day = 8640000;
    const nonce = Math.random().toString(radix).slice(slice);
    const header = {alg: 'RS256', typ: 'JWT'};
    const payload = {
      iss: 'http://dex.oauth:5556/dex/auth',
      sub: window.btoa(Math.random().toString(radix).slice(slice)),
      aud: 'kubermatic',
      exp: Date.now() + day,
      iat: Date.now(),
      nonce: nonce,
      email: Mocks.currentUser.email,
      email_verified: true,
      name: 'roxy',
    };
    const signature = Math.random().toString(radix).slice(slice);
    const token =
      window.btoa(JSON.stringify(header)) +
      '.' +
      window.btoa(JSON.stringify(payload)) +
      '.' +
      window.btoa(JSON.stringify(signature));

    cy.setCookie('token', token);
    cy.setCookie('nonce', nonce);
    cy.setCookie('autoredirect', 'true');
  }

  logout(): void {
    cy.clearCookies();
    cy.visit('/');
  }

  private _init(): void {
    cy.intercept(Endpoint.CurrentUser, req => req.reply({body: MockedLoginStrategy._userFixture}));
  }
}
