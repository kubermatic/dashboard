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

import {DOCUMENT} from '@angular/common';
import {AfterViewInit, Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {MeteringConfiguration} from '@shared/entity/datacenter';
import {Report} from '@shared/entity/metering';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-metering-list',
  templateUrl: './template.html',
})
export class MeteringListComponent implements OnInit, AfterViewInit {
  private readonly _unsubscribe = new Subject<void>();
  private _fetchingReport = '';
  reports: Report[] = [];
  dataSource = new MatTableDataSource<Report>();
  readonly displayedColumns: string[] = ['name', 'size', 'modified', 'actions'];
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() config: MeteringConfiguration;

  private _isLoading = true;

  get isLoading(): boolean {
    return this._isLoading;
  }

  get enabled(): boolean {
    return this.config.enabled && !!this.config.storageSize && !!this.config.storageClassName;
  }

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit() {
    this.dataSource.data = this.reports;

    this._settingsService.reports.pipe(takeUntil(this._unsubscribe)).subscribe(reports => {
      this.reports = reports;
      this.dataSource.data = this.reports;
      this._isLoading = false;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  canDownload(_report: Report): boolean {
    return true;
  }

  isFetchingReport(report: Report): boolean {
    return this._fetchingReport === report.name;
  }

  download(report: Report): void {
    this._fetchingReport = report.name;

    this._settingsService
      .reportDownload(report.name)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: url => {
          this._fetchingReport = '';
          this._document.defaultView?.open(url, '_blank');
        },
        complete: () => (this._fetchingReport = ''),
        error: _ => (this._fetchingReport = ''),
      });
  }

  isPaginatorVisible(): boolean {
    return this.reports && this.reports.length > 0 && this.paginator && this.reports.length > this.paginator.pageSize;
  }
}
