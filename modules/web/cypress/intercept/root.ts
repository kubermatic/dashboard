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

import {Endpoints, Fixtures} from '@kmtypes';

export class Root {
  private static _userFixture = Fixtures.User;

  constructor() {
    cy.intercept(Endpoints.User.Me, req => req.reply({body: Root._userFixture}));
    cy.intercept(Endpoints.Resource.Seed.List, req => req.reply({fixture: Fixtures.Resource.Seed.List}));
  }

  login(email: string, _: string, isAdmin: boolean): void {
    Root._userFixture.email = email;
    Root._userFixture.name = email.split('@')[0];
    Root._userFixture.isAdmin = isAdmin;

    this._mockAuthCookies();
  }

  private _mockAuthCookies(): void {
    const radix = 36;
    const slice = 2;
    const day = 8640000;
    const nonce = Math.random().toString(radix).slice(slice);
    const header = {alg: 'RS256', typ: 'JWT'};
    const payload = {
      iss: 'http://dex.dex:5556/dex/auth',
      sub: window.btoa(Math.random().toString(radix).slice(slice)),
      aud: 'kubermatic',
      exp: Date.now() + day,
      iat: Date.now(),
      nonce: nonce,
      email: Root._userFixture.email,
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
}
