// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Datacenter} from '@shared/entity/datacenter';
import {DEPRECATED_PROVIDERS, INTERNAL_NODE_PROVIDERS, NodeProvider} from '@shared/model/NodeProviderConstants';
import * as countryCodeLookup from 'country-code-lookup';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {DatacenterDataDialogComponent} from './datacenter-data-dialog/component';

@Component({
  selector: 'km-dynamic-datacenters',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class DynamicDatacentersComponent implements OnInit, OnDestroy, OnChanges {
  datacenters: Datacenter[] = [];
  dataSource = new MatTableDataSource<Datacenter>();
  displayedColumns: string[] = ['datacenter', 'seed', 'country', 'provider', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  seeds: string[] = [];
  seedFilter: string;
  countries: string[] = [];
  countryFilter: string;
  readonly providers = INTERNAL_NODE_PROVIDERS;
  providerFilter: NodeProvider;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit() {
    this.dataSource.data = this.datacenters;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'datacenter';
    this.sort.direction = 'asc';

    this.dataSource.sortingDataAccessor = (datacenter, property) => {
      switch (property) {
        case 'datacenter':
          return datacenter.metadata.name;
        case 'seed':
          return datacenter.spec.seed;
        case 'country':
          return this.getCountryName(datacenter.spec.country);
        case 'provider':
          return datacenter.spec.provider;
        default:
          return datacenter[property];
      }
    };

    this._datacenterService.datacenters
      .pipe(tap(datacenters => this._setCountries(datacenters)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenters => {
        // Filter out datacenters with deprecated providers
        this.datacenters = datacenters.filter(dc => !DEPRECATED_PROVIDERS.includes(dc.spec.provider));
        this.filter();
      });

    this._datacenterService.seeds.pipe(takeUntil(this._unsubscribe)).subscribe(seeds => (this.seeds = seeds));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.filter();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getCountryName(code: string): string {
    if (!code) {
      return '';
    }

    const country = countryCodeLookup.byIso(code);
    return country ? country.country : code;
  }

  private _setCountries(datacenters: Datacenter[]) {
    // Only include countries from datacenters with non-deprecated providers
    const filteredDatacenters = datacenters.filter(dc => !DEPRECATED_PROVIDERS.includes(dc.spec.provider));
    const uniqueCountries = Array.from(new Set(filteredDatacenters.map(datacenter => datacenter.spec.country)));
    this.countries = _.sortBy(uniqueCountries, c => c.toLowerCase());
  }

  filter(): void {
    this.dataSource.data = this.datacenters.filter(datacenter => {
      let isVisible = true;

      if (this.countryFilter) {
        isVisible = isVisible && datacenter.spec.country === this.countryFilter;
      }

      if (this.seedFilter) {
        isVisible = isVisible && datacenter.spec.seed === this.seedFilter;
      }

      if (this.providerFilter) {
        isVisible = isVisible && datacenter.spec.provider === this.providerFilter;
      }

      return isVisible;
    });
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Datacenter',
        isEditing: false,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(DatacenterDataDialogComponent, dialogConfig);
  }

  edit(datacenter: Datacenter): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Datacenter',
        datacenter: datacenter,
        isEditing: true,
        confirmLabel: 'Edit',
      },
    };
    this._dialogModeService.isEditDialog = true;
    this._matDialog
      .open(DatacenterDataDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  delete(datacenter: Datacenter): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Datacenter',
        message: `Delete <b>${_.escape(datacenter.metadata.name)}</b> datacenter permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._datacenterService.deleteDatacenter(datacenter)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${datacenter.metadata.name} datacenter`);
        this._datacenterService.refreshDatacenters();
      });
  }

  isPaginatorVisible(): boolean {
    return (
      this.datacenters &&
      this.datacenters.length > 0 &&
      this.paginator &&
      this.datacenters.length > this.paginator.pageSize
    );
  }
}
