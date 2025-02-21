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

import {Component, OnDestroy, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {SeedOverviewDatasource} from '@app/settings/admin/seed-configurations/types/seed-configurations';
import {DatacenterService} from '@core/services/datacenter';
import {SeedOverview} from '@shared/entity/datacenter';
import {handleSeedOverviewDatasource} from '@shared/utils/seed-configurations';
import _ from 'lodash';
import {Subject, forkJoin, of} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

enum Column {
  Phase = 'phase',
  Name = 'name',
  Providers = 'providers',
  Datacenters = 'datacentersCount', // # total datacenters per seed
  Clusters = 'clustersCount', // # total clusters per seed
  Location = 'location',
}

@Component({
  selector: 'km-seed-configurations',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class SeedConfigurationsComponent implements OnDestroy {
  readonly Column = Column;
  readonly displayedProviders = 5;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  isInitializing: boolean;
  dataSource = new MatTableDataSource<SeedOverviewDatasource>();
  displayedColumns: string[] = Object.values(Column);
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this.sort.active = Column.Name;
    this.sort.direction = 'asc';
    this.dataSource.sort = this.sort;

    this.isInitializing = true;
    this._datacenterService.seeds
      .pipe(
        switchMap(seeds => {
          let obs$ = [];
          if (seeds?.length) {
            obs$ = seeds.map((seed: string) => this._datacenterService.getSeedOverview(seed));
          } else {
            return of([]);
          }
          return forkJoin(obs$);
        }),
        takeUntil(this._unsubscribe)
      )
      .subscribe((seedsOverview: SeedOverview[]) => {
        this.isInitializing = false;
        this.dataSource.data = this._handleSeedsOverviewDatasource(seedsOverview);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isEmpty(seedOverviewDatasource: SeedOverviewDatasource[]): boolean {
    return _.isEmpty(seedOverviewDatasource);
  }

  getHiddenProviders(providers: string[]): string {
    let hiddenProviders = '';
    for (let i = this.displayedProviders; i < providers.length; i++) {
      hiddenProviders += `${providers[i]}`;
      if (i < providers.length - 1) {
        hiddenProviders += ', ';
      }
    }
    return hiddenProviders;
  }

  getStatusIcon(seedOverview: SeedOverview): string {
    return SeedOverview.getStatusIcon(seedOverview);
  }

  getDisplayedProviders(seedOverviewDatasource: SeedOverviewDatasource): string[] {
    const providers = seedOverviewDatasource.providerNames;
    if (providers?.length > this.displayedProviders) {
      return _.take(providers, this.displayedProviders);
    }
    return providers;
  }

  goToDetails(seedName: string): void {
    this._router.navigate([`/settings/seeds/${seedName}`]);
  }

  private _handleSeedsOverviewDatasource(seedsOverview: SeedOverview[]): SeedOverviewDatasource[] {
    const list = [];
    seedsOverview
      ?.filter(seedOverview => !_.isEmpty(seedOverview))
      .forEach((seedOverview: SeedOverview) => {
        const seedOverviewDatasource = handleSeedOverviewDatasource(seedOverview);
        list.push(seedOverviewDatasource);
      });
    return list;
  }
}
