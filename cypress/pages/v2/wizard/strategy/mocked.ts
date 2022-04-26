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
import {Provider} from '../../../../utils/provider';
import {WizardStrategy} from './types';

export class MockedWizardStrategy implements WizardStrategy {
  private static _clustersFixturePath = '';
  private static _clusterFixturePath = '';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static readonly _fixtureEmptyObjectPath = 'empty-object.json';
  private static _activeClustersFixture = MockedWizardStrategy._fixtureEmptyArrayPath;
  private static _activeClusterFixture = MockedWizardStrategy._fixtureEmptyObjectPath;

  constructor() {
    this._init();
  }

  onProviderChange(provider: Provider): void {
    MockedWizardStrategy._clustersFixturePath = `${provider}/clusters.json`;
    MockedWizardStrategy._clusterFixturePath = `${provider}/cluster.json`;
  }

  onCreate(): void {
    MockedWizardStrategy._activeClustersFixture = MockedWizardStrategy._clustersFixturePath;
    MockedWizardStrategy._activeClusterFixture = MockedWizardStrategy._clusterFixturePath;
  }

  onDelete(): void {
    MockedWizardStrategy._activeClustersFixture = MockedWizardStrategy._fixtureEmptyArrayPath;
    MockedWizardStrategy._activeClusterFixture = MockedWizardStrategy._fixtureEmptyObjectPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.Clusters, req => {
      req.reply({fixture: MockedWizardStrategy._activeClustersFixture});
    });

    cy.intercept(Endpoint.Cluster, req => {
      req.reply({fixture: MockedWizardStrategy._activeClusterFixture});
    });
  }
}
