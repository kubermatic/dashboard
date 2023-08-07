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

import {DOCUMENT} from '@angular/common';
import {Component, OnInit, ViewChild, Inject, Input, OnDestroy} from '@angular/core';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {Report} from '@shared/entity/metering';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '@app/shared/components/confirmation-dialog/component';
import {NotificationService} from '@app/core/services/notification';
import {Subject} from 'rxjs';

enum Column {
  name = 'name',
  size = 'size',
  lastModified = 'lastModified',
  actions = 'actions',
}

@Component({
  selector: 'km-metering-legacy-reports-list',
  templateUrl: './template.html',
})
export class MeteringLegacyReportListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  @Input() reports: Report[];

  readonly column = Column;
  readonly displayedColumns: string[] = Object.values(Column);

  private _reportsInProgress = new Set<string>([]);

  dataSource = new MatTableDataSource<Report>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private readonly _meteringService: MeteringService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit() {
    this.dataSource.data = this.reports;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'lastModified';
    this.sort.direction = 'desc';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  download(reportName: string): void {
    this._reportsInProgress.add(reportName);

    this._meteringService
      .reportDownload(reportName)
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
        message: `Do you want to delete <b>${reportName}</b> report permanently?`,
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
          return this._meteringService.reportDelete(reportName);
        })
      )
      .pipe(take(1))
      .subscribe({
        next: () => {
          this._meteringService.onReportListChange$.next();
          this.dataSource.data = this.reports.filter(report => report.name !== reportName);
          this._notificationService.success(`Deleting the ${reportName} report`);
        },
        complete: () => this._reportsInProgress.delete(reportName),
        error: _ => this._reportsInProgress.delete(reportName),
      });
  }

  isProcessingReport(report: Report): boolean {
    return this._reportsInProgress.has(report.name);
  }

  isPaginatorVisible(): boolean {
    return this.reports?.length > this.paginator?.pageSize;
  }
}
