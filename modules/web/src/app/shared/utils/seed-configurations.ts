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
import {SeedOverviewDatasource} from '@app/settings/admin/seed-configurations/types/seed-configurations';

export function handleSeedOverviewDatasource(seedOverview: SeedOverview): SeedOverviewDatasource {
  let totalClustersPerSeed = 0;
  let totalDatacentersPerSeed = 0;
  const providers = Object.keys(seedOverview.providers);

  providers.forEach((provider: string) => {
    const providerObj = seedOverview.providers[provider];
    const datacentersPerProvider = Object.keys(providerObj);

    let clustersCount = 0;
    datacentersPerProvider.forEach(datacenter => {
      clustersCount += providerObj[datacenter];
    });

    totalClustersPerSeed += clustersCount;
    totalDatacentersPerSeed += datacentersPerProvider.length;
  });

  return {
    ...seedOverview,
    providerCount: providers.length,
    clustersCount: totalClustersPerSeed,
    datacentersCount: totalDatacentersPerSeed,
    providerNames: providers,
  } as SeedOverviewDatasource;
}
