//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2020 Kubermatic GmbH
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

import {DOCUMENT} from '@angular/common';
import {AfterViewInit, Component, Inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {MeteringConfiguration} from '@shared/entity/datacenter';
import {Report} from '@shared/entity/metering';
import {merge, of, Subject} from 'rxjs';
import {filter, switchMap, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-metering-list',
  templateUrl: './template.html',
})
export class MeteringListComponent implements OnInit, OnChanges, AfterViewInit {
  private readonly _unsubscribe = new Subject<void>();
  private _fetchingReport = '';
  private _configChanged$ = new Subject<MeteringConfiguration>();
  reports: Report[] = [];
  dataSource = new MatTableDataSource<Report>();
  readonly displayedColumns: string[] = ['name', 'size', 'lastModified', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
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
    this.dataSource.sort = this.sort;
    this.sort.active = 'lastModified';
    this.sort.direction = 'desc';

    merge(this._configChanged$, of(this.config))
      .pipe(filter(config => config.enabled))
      .pipe(switchMap(_ => this._settingsService.reports))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(reports => {
        this.reports = reports;
        this.dataSource.data = this.reports;
        this._isLoading = false;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this._configChanged$.next(changes.config.currentValue as MeteringConfiguration);
    }
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
