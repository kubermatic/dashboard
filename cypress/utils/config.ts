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

export class Config {
  static readonly defaultPageLoadTimeout = 20000;
  static readonly defaultElementLoadTimeout = 40000;

  static isAPIMocked(): boolean {
    return Cypress.env('MOCKS') === 'true' || Cypress.env('MOCKS') === true;
  }

  static isEnterpriseEdition(): boolean {
    return Cypress.env('KUBERMATIC_EDITION') !== 'ce';
  }

  static userEmail(): string {
    return Config.isAPIMocked() ? 'roxy@kubermatic.io' : Cypress.env('USERNAME');
  }

  static adminEmail(): string {
    return Config.isAPIMocked() ? 'roxy2@kubermatic.io' : Cypress.env('USERNAME_2');
  }

  static password(): string {
    return Config.isAPIMocked() ? 'password' : Cypress.env('PASSWORD');
  }

  static kubeconfig(): string {
    return Config.isAPIMocked() ? 'test-kubeconfig' : window.atob(Cypress.env('KUBECONFIG_ENCODED'));
  }

  static seedName(): string {
    return Config.isAPIMocked() ? 'test-seed' : Cypress.env('SEED_NAME');
  }
}
