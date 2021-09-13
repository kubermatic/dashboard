// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort, SortDirection} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DatacenterService} from '@core/services/datacenter';
import {UserService} from '@core/services/user';
import {AdminSeed} from '@shared/entity/datacenter';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {EditBucketSettingDialog} from './edit-bucket-setting-dialog/component';
import {EditCredentialsDialog} from './edit-credentials-dialog/component';

enum Column {
  Seed = 'seed',
  Bucket = 'bucket',
  Endpoint = 'endpoint',
  Actions = 'actions',
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
  displayedColumns: string[] = Object.keys(Column).map(key => Column[key]);
  readonly Column = Column;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private get _seeds(): AdminSeed[] {
    return this.dataSource.data;
  }

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog
  ) {}

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

  editBucketSettings(seed: AdminSeed): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        seed: seed,
      },
    };

    this._matDialog.open(EditBucketSettingDialog, dialogConfig);
  }

  editCredentials(seed: AdminSeed): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        seed: seed,
      },
    };

    this._matDialog.open(EditCredentialsDialog, dialogConfig);
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

  private _sortByName(direction: SortDirection): void {
    this.dataSource.data = this.dataSource.data.sort((a, b) =>
      direction === 'asc' ? a.name.localeCompare(b.name) : a.name.localeCompare(b.name) * -1
    );
  }
}
