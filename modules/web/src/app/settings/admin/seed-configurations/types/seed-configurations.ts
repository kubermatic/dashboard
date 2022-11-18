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

import {SeedOverview} from '@shared/entity/datacenter';

export interface DatacenterDetail {
  datacenter: string;
  clustersCount: number;
}

export interface ProviderDetail {
  provider: string;
  datacentersCount: number;
  clustersCount: number;
}

// Note: SeedOverviewDatasource is extension of SeedOverview to customize payload for UI
export class SeedOverviewDatasource extends SeedOverview {
  providerCount: number; // # providers count / seed
  clustersCount: number; // # clusters count / seed
  datacentersCount: number; // # datacenters count / seed
  providerNames: string[]; // # providers name
}
