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

import {Endpoints} from '@ctypes/endpoints';
import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from '@ctypes/pages';

export class MockedServiceAccountStrategy implements ServiceAccountStrategy {
  private static readonly _fixturePath = 'service-accounts.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedServiceAccountStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedServiceAccountStrategy._activeFixture = MockedServiceAccountStrategy._fixturePath;
  }

  onDelete(): void {
    MockedServiceAccountStrategy._activeFixture = MockedServiceAccountStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoints.Resource.ServiceAccount.List, req => {
      req.reply({fixture: MockedServiceAccountStrategy._activeFixture});
    });
  }
}

export class MockedServiceAccountTokenStrategy implements ServiceAccountTokenStrategy {
  private static readonly _fixturePath = 'tokens.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedServiceAccountTokenStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedServiceAccountTokenStrategy._activeFixture = MockedServiceAccountTokenStrategy._fixturePath;
  }

  onDelete(): void {
    MockedServiceAccountTokenStrategy._activeFixture = MockedServiceAccountTokenStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoints.Resource.ServiceAccount.Tokens, req => {
      req.reply({fixture: MockedServiceAccountTokenStrategy._activeFixture});
    });
  }
}
