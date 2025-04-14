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
import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {NotificationService} from '@app/core/services/notification';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {ConfirmationDialogComponent} from '@app/shared/components/confirmation-dialog/component';
import {UserService} from '@core/services/user';
import {Report} from '@shared/entity/metering';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';

enum Column {
  name = 'name',
  size = 'size',
  lastModified = 'lastModified',
  actions = 'actions',
}

@Component({
  selector: 'km-metering-reports-list',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class MeteringReportListComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  private _reportsInProgress = new Set<string>([]);

  scheduleName: string;
  schedule: string;
  interval: number;
  retention?: number;
  reports: Report[] = [];

  readonly column = Column;
  readonly displayedColumns: string[] = Object.values(Column);

  dataSource = new MatTableDataSource<Report>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _isLoadingReports = true;
  private _isLoadingConfig = true;

  get isLoadingReports(): boolean {
    return this._isLoadingReports;
  }

  get isLoadingConfig(): boolean {
    return this._isLoadingConfig;
  }

  constructor(
    private readonly _meteringService: MeteringService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _matDialog: MatDialog,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit() {
    this.dataSource.data = this.reports;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'lastModified';
    this.sort.direction = 'desc';

    this.scheduleName = this._route.snapshot.params.scheduleId;

    this._meteringService
      .getScheduleConfiguration(this.scheduleName)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(config => {
        this.scheduleName = config.name;
        this.schedule = config.schedule;
        this.interval = config.interval;
        this.retention = config.retention;
        this._isLoadingConfig = false;
      });

    this._meteringService
      .reports(this.scheduleName)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(reports => {
        this.reports = reports.map(this._trimScheduleFromReportName.bind(this));
        this.dataSource.data = this.reports;
        this._isLoadingReports = false;
      });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.dataSource.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isProcessingReport(report: Report): boolean {
    return this._reportsInProgress.has(report.name);
  }

  goBack(): void {
    this._router.navigate(['/settings/metering']);
  }

  download(reportName: string): void {
    this._reportsInProgress.add(reportName);

    this._meteringService
      .reportDownload(reportName, this.scheduleName)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: url => {
          this._reportsInProgress.delete(reportName);
          this._document.defaultView?.open(url, '_blank');
        },
        complete: () => this._reportsInProgress.delete(reportName),
        error: _ => this._reportsInProgress.delete(reportName),
      });
  }

  remove(reportName: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Metering Report',
        message: `Do you want to delete <b>${_.escape(reportName)}</b> report permanently?`,
        confirmLabel: 'Delete',
        warning: 'This change is permanent.',
      },
    };
    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ => {
          this._reportsInProgress.add(reportName);
          return this._meteringService.reportDelete(reportName, this.scheduleName);
        })
      )
      .pipe(take(1))
      .subscribe({
        next: () => {
          this._meteringService.onReportListChange$.next();
          this._notificationService.success(`Deleting the ${reportName} report`);
        },
        error: _ => this._reportsInProgress.delete(reportName),
      });
  }

  isPaginatorVisible(): boolean {
    return this.reports && this.reports.length > 0 && this.paginator && this.reports.length > this.paginator.pageSize;
  }

  private _trimScheduleFromReportName(report: Report): Report {
    return {...report, name: report.name.replace(`${this.scheduleName}/`, '')};
  }
}
