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
import {ClusterListStrategy} from '@ctypes/pages';

export class MockedClusterListStrategy implements ClusterListStrategy {
  private static readonly _fixturePath = 'clusters.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedClusterListStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedClusterListStrategy._activeFixture = MockedClusterListStrategy._fixturePath;
  }

  onDelete(): void {
    MockedClusterListStrategy._activeFixture = MockedClusterListStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoints.Resource.Cluster.List, req =>
      req.reply({fixture: MockedClusterListStrategy._activeFixture})
    );
  }
}
