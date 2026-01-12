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

import {Component, OnInit, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {
  DatacenterDetail,
  ProviderDetail,
  SeedOverviewDatasource,
} from '@app/settings/admin/seed-configurations/types/seed-configurations';
import {ANEXIA_DEPRECATED_MESSAGE} from '@app/shared/constants/common';
import {NodeProvider} from '@app/shared/model/NodeProviderConstants';
import {DatacenterService} from '@core/services/datacenter';
import {SeedOverview} from '@shared/entity/datacenter';
import {handleSeedOverviewDatasource} from '@shared/utils/seed-configurations';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';

enum Column {
  StateArrow = 'stateArrow',
  Provider = 'provider',
  Datacenters = 'datacentersCount', // # total datacenters per provider
  Clusters = 'clustersCount', // # total clusters per provider
  ClustersByDatacenter = 'clustersByDatacenter',
}

@Component({
  selector: 'km-seed-configuration-details',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class SeedConfigurationDetailsComponent implements OnInit {
  readonly Column = Column;
  readonly nodeProvider = NodeProvider;
  readonly ANEXIA_DEPRECATED_MESSAGE = ANEXIA_DEPRECATED_MESSAGE;
  datacenterDetailPerProvider: Record<string, DatacenterDetail[]> = {};
  isShowProviders: Record<string, boolean> = {};
  isLoadingDetails: boolean;
  displayedColumns: string[] = Object.values(Column).filter(column => column !== Column.ClustersByDatacenter);
  dataSource = new MatTableDataSource<ProviderDetail>();
  toggledColumns: string[] = [Column.ClustersByDatacenter];
  seedName: string;
  seedOverviewDatasource: SeedOverviewDatasource;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router
  ) {}

  @ViewChild(MatSort, {static: false}) set matSort(ms: MatSort) {
    if (!ms) {
      return;
    }
    this.dataSource.sortingDataAccessor = (item: ProviderDetail, property: string) => {
      switch (property) {
        case Column.Provider:
          return item.provider;
        case Column.Datacenters:
          return item.datacentersCount;
        case Column.Clusters:
          return item.clustersCount;
        default:
          return item[property];
      }
    };
    this.dataSource.sort = ms;
  }

  ngOnInit(): void {
    this.seedName = this._route.snapshot.params.seedName;
    this.isLoadingDetails = true;
    this._datacenterService
      .getSeedOverview(this.seedName)
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingDetails = false))
      )
      .subscribe((seedOverview: SeedOverview) => {
        if (_.isEmpty(seedOverview)) {
          this.goBack();
          return;
        }
        this.seedOverviewDatasource = handleSeedOverviewDatasource(seedOverview);
        this.dataSource.data = this._mapProviderDetailToArray(seedOverview);
        this._setDatacenterDetailPerProvider(seedOverview);
      });
  }

  toggleProvider(element: ProviderDetail): void {
    this.isShowProviders[element[Column.Provider]] = !this.isShowProviders[element[Column.Provider]];
  }

  goBack(): void {
    this._router.navigate(['/settings/seeds']);
  }

  getStatusIcon(seedOverviewDatasource: SeedOverviewDatasource): string {
    return SeedOverview.getStatusIcon(seedOverviewDatasource);
  }

  private _mapProviderDetailToArray(seedOverview: SeedOverview): ProviderDetail[] {
    const providers: string[] = Object.keys(seedOverview.providers);

    return providers.map(provider => {
      const providerObj = seedOverview.providers[provider];
      const datacenters = Object.keys(providerObj);
      let clustersCount = 0;

      datacenters.forEach(datacenter => {
        clustersCount += providerObj[datacenter];
      });

      return {
        provider: provider,
        datacentersCount: datacenters.length,
        clustersCount: clustersCount,
      } as ProviderDetail;
    });
  }

  private _setDatacenterDetailPerProvider(seedOverview: SeedOverview): void {
    const providers = Object.keys(seedOverview.providers);
    providers.map(provider => {
      const providerObj = seedOverview.providers[provider];
      const datacenters = Object.keys(providerObj);

      // Multiple datacenters exists per provider.
      let datacenterDetails = [];
      datacenterDetails = datacenters.map(datacenter => {
        return {
          datacenter: datacenter,
          clustersCount: providerObj[datacenter],
        } as DatacenterDetail;
      });

      this.datacenterDetailPerProvider[provider] = datacenterDetails;
    });
  }
}
