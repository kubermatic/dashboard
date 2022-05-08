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

export class ServiceAccounts {
  private static _serviceAccountListFixture = Fixtures.EmptyArray;
  private static _serviceAccountFixture = Fixtures.EmptyObject;
  private static _serviceAccountTokenListFixture = Fixtures.EmptyArray;

  constructor() {
    cy.intercept(RequestType.GET, Endpoints.Resource.ServiceAccount.List, req =>
      req.reply({fixture: ServiceAccounts._serviceAccountListFixture})
    );
    cy.intercept(RequestType.POST, Endpoints.Resource.ServiceAccount.List, req =>
      req.reply({fixture: ServiceAccounts._serviceAccountFixture})
    );
    cy.intercept(Endpoints.Resource.ServiceAccount.Detail, req =>
      req.reply({fixture: ServiceAccounts._serviceAccountFixture})
    );
    cy.intercept(Endpoints.Resource.ServiceAccount.Tokens, req =>
      req.reply({fixture: ServiceAccounts._serviceAccountTokenListFixture})
    );
  }

  onCreate(): void {
    ServiceAccounts._serviceAccountListFixture = Fixtures.Resource.ServiceAccount.List;
    ServiceAccounts._serviceAccountFixture = Fixtures.Resource.ServiceAccount.Detail;
  }

  onDelete(): void {
    ServiceAccounts._serviceAccountListFixture = Fixtures.EmptyArray;
    ServiceAccounts._serviceAccountFixture = Fixtures.EmptyObject;
  }

  onTokenCreate(): void {
    ServiceAccounts._serviceAccountTokenListFixture = Fixtures.Resource.ServiceAccount.TokenList;
  }

  onTokenDelete(): void {
    ServiceAccounts._serviceAccountTokenListFixture = Fixtures.EmptyArray;
  }
}
