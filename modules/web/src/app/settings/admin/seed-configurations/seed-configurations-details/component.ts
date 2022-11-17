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

//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {SeedOverview} from '@shared/entity/datacenter';
import {DatacenterService} from '@core/services/datacenter';
import {MatTableDataSource} from '@angular/material/table';
import {
  ClusterByDatacenter,
  handleSeedOverviewDatasource,
  ProviderDetail,
  SeedOverviewDatasource,
} from '@shared/utils/seed-configurations';

enum Column {
  StateArrow = 'stateArrow',
  Provider = 'provider',
  Datacenters = 'datacentersCount', // # total datacenters per provider
  Clusters = 'clustersCount', // # total clusters per provider
  ClustersByDatacenter = 'clustersByDatacenter',
}

@Component({
  selector: 'km-admin-settings-seed-configurations-details',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class AdminSettingsSeedConfigurationsDetailsComponent implements OnInit {
  readonly Column = Column;
  clustersByDatacenter: Record<string, ClusterByDatacenter[]> = {};
  displayedColumns: string[] = Object.values(Column).filter(column => column !== Column.ClustersByDatacenter);
  dataSource = new MatTableDataSource<ProviderDetail>();
  toggledColumns: string[] = [Column.ClustersByDatacenter];
  seedName: string;
  seedOverviewDatasource: SeedOverviewDatasource;
  isLoadingDetails: boolean;
  isShowProviders = [];

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this.seedName = this._route.snapshot.params.seedName;

    this.isLoadingDetails = true;
    this._datacenterService
      .getSeedOverview(this.seedName)
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingDetails = false))
      )
      .subscribe((seedsOverview: SeedOverview) => {
        this.seedOverviewDatasource = handleSeedOverviewDatasource(seedsOverview);
        this.dataSource.data = this._mapProviderDetailToArray(seedsOverview);
        this._setClustersByDatacenterPerProvider(seedsOverview);
      });
  }

  toggleProvider(element: ProviderDetail): void {
    this.isShowProviders[element[Column.Provider]] = !this.isShowProviders[element[Column.Provider]];
  }

  goBack(): void {
    this._router.navigate(['/settings/seeds']);
  }

  getStatusColor(seedOverviewDatasource: SeedOverviewDatasource): string {
    return SeedOverview.getStatusIcon(seedOverviewDatasource);
  }

  private _mapProviderDetailToArray(seedOverview: SeedOverview): ProviderDetail[] {
    const providers = Object.keys(seedOverview.providers);

    return providers.map(provider => {
      const providerObj = seedOverview.providers[provider];
      const datacentersPerProvider = Object.keys(providerObj);
      let clustersPerProviderDatacenters = 0;

      datacentersPerProvider.forEach(datacenter => {
        clustersPerProviderDatacenters += providerObj[datacenter];
      });

      return {
        provider: provider,
        datacentersCount: datacentersPerProvider.length,
        clustersCount: clustersPerProviderDatacenters,
      } as ProviderDetail;
    });
  }

  private _setClustersByDatacenterPerProvider(seedOverview: SeedOverview): void {
    const providers = Object.keys(seedOverview.providers);
    providers.map(provider => {
      const providerObj = seedOverview.providers[provider];
      const datacentersPerProvider = Object.keys(providerObj);

      // Per Provider may contains multiple datacenters:
      let clusterByDatacenterPerProvider = [];
      clusterByDatacenterPerProvider = datacentersPerProvider.map(datacenter => {
        return {
          datacenter: datacenter,
          clustersCount: providerObj[datacenter],
        } as ClusterByDatacenter;
      });

      this.clustersByDatacenter[provider] = clusterByDatacenterPerProvider;
    });
  }
}
