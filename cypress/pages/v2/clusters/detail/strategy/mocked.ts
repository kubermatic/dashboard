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

import {Endpoint} from '../../../../../utils/endpoint';
import {ClusterDetailStrategy} from './types';

export class MockedClusterDetailStrategy implements ClusterDetailStrategy {
  private static readonly _fixturePath = 'clusters.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedClusterDetailStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedClusterDetailStrategy._activeFixture = MockedClusterDetailStrategy._fixturePath;
  }

  onDelete(): void {
    MockedClusterDetailStrategy._activeFixture = MockedClusterDetailStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.Clusters, req => req.reply({fixture: MockedClusterDetailStrategy._activeFixture}));
  }
}
