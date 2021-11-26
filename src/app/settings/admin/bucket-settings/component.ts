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

import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort, SortDirection} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DatacenterService} from '@core/services/datacenter';
import {UserService} from '@core/services/user';
import {AdminSeed} from '@shared/entity/datacenter';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import _ from 'lodash';

enum Column {
  Seed = 'seed',
  Destinations = 'destinations',
  StateArrow = 'stateArrow',
}

@Component({
  selector: 'km-admin-settings-bucket-settings',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BucketSettingsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly _unsubscribe = new Subject<void>();

  isLoading = false;
  dataSource: MatTableDataSource<AdminSeed>;
  displayedColumns: string[] = [Column.StateArrow, Column.Seed];
  toggledColumns: string[] = [Column.Destinations];
  isShowDestinations = [];
  readonly Column = Column;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private get _seeds(): AdminSeed[] {
    return this.dataSource.data;
  }

  constructor(private readonly _datacenterService: DatacenterService, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<AdminSeed>([]);
    this.isLoading = true;

    this._datacenterService.adminSeeds.pipe(takeUntil(this._unsubscribe)).subscribe(seeds => {
      this.dataSource.data = seeds;
      this._sortByName('asc');
      this.isLoading = false;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  displayWarning(seed: AdminSeed): boolean {
    return !!this._hasOldData(seed) && !this._hasDestinations(seed);
  }

  toggleDestinations(element: any): void {
    this.isShowDestinations[element.name] = !this.isShowDestinations[element.name];
  }

  onSortChange(sort: Sort): void {
    switch (sort.active) {
      case Column.Seed:
        this._sortByName(sort.direction);
    }
  }

  isPaginatorVisible(): boolean {
    return this._seeds && this._seeds.length > 0 && this.paginator && this._seeds.length > this.paginator.pageSize;
  }

  // hasOldData() is used to verify, if a user has configured
  // backupRestore.s3BucketName or backupRestore.s3Endpoint
  // in kubermatic 2.18. Starting with 2.19 the recommended way
  // is to use backup destinations.
  // This check can be removed within one of the following versions,
  // but not sure yet in which version exactly.
  private _hasOldData(seed: AdminSeed): boolean {
    return (
      !!seed &&
      !!seed.spec &&
      !!seed.spec.backupRestore &&
      (!!seed.spec.backupRestore.s3BucketName || !!seed.spec.backupRestore.s3Endpoint)
    );
  }

  private _hasDestinations(seed): boolean {
    return (
      !!seed && !!seed.spec && !!seed.spec.etcdBackupRestore && !_.isEmpty(seed.spec.etcdBackupRestore.destinations)
    );
  }

  private _sortByName(direction: SortDirection): void {
    this.dataSource.data = this.dataSource.data.sort((a, b) =>
      direction === 'asc' ? a.name.localeCompare(b.name) : a.name.localeCompare(b.name) * -1
    );
  }
}
