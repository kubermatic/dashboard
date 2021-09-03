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

import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DatacenterService} from '@core/services/datacenter';
import {UserService} from '@core/services/user';
import {AdminSeed} from '@shared/entity/datacenter';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {EditBucketSettingDialog} from './edit-bucket-setting-dialog/component';
import {EditCredentialsDialog} from './edit-credentials-dialog/component';

@Component({
  selector: 'km-admin-settings-bucket-settings',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class BucketSettingsComponent implements OnInit, OnChanges {
  seeds: AdminSeed[] = [];
  dataSource = new MatTableDataSource<AdminSeed>();
  displayedColumns: string[] = ['seed', 'bucket', 'endpoint', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.seeds;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'seed';
    this.sort.direction = 'asc';

    this._datacenterService.adminSeeds.pipe(takeUntil(this._unsubscribe)).subscribe(seeds => {
      this.seeds = _.sortBy(seeds, seed => seed.name.toLowerCase());
      this.dataSource.data = this.seeds;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.seeds;
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

  isPaginatorVisible(): boolean {
    return this.seeds && this.seeds.length > 0 && this.paginator && this.seeds.length > this.paginator.pageSize;
  }
}
