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

export function mockAuthCookies(): void {
  const nonce = Math.random().toString(36).slice(2);
  const header = {alg: 'RS256', typ: 'JWT'};
  const payload = {
    iss: 'http://dex.oauth:5556/dex/auth',
    sub: btoa(Math.random().toString(36).slice(2)),
    aud: 'kubermatic',
    exp: Date.now() + 1000 * 60 * 60 * 24,
    iat: Date.now(),
    nonce: nonce,
    email: 'roxy@kubermatic.io',
    email_verified: true,
    name: 'roxy'
  };
  const signature = Math.random().toString(36).slice(2);
  const token = btoa(JSON.stringify(header)) + "." + btoa(JSON.stringify(payload)) + "." + btoa(JSON.stringify(signature));

  cy.setCookie('token', token);
  cy.setCookie('nonce', nonce);
}
