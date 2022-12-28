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

import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {takeUntil, filter, switchMap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {QuotaService} from './service';
import {UserService} from '@core/services/user';
import {QuotaDetails} from '@shared/entity/quota';
import _ from 'lodash';
import {ProjectQuotaDialogComponent} from './project-quota-dialog/component';
import {ConfirmationDialogComponent, ConfirmationDialogConfig} from '@shared/components/confirmation-dialog/component';
import {NotificationService} from '@core/services/notification';
import {ThemePalette} from '@angular/material/core';

enum Column {
  ProjectId = 'ProjectId',
  CPU = 'CPU',
  Memory = 'Memory',
  Storage = 'Storage',
  Actions = 'Actions',
}

class progressBarData {
  color: string;
  value: number;
  useageQuota: string;
}

@Component({
  selector: 'km-quotas',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class QuotasComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();

  quotas: QuotaDetails[] = [];
  dataSource = new MatTableDataSource<QuotaDetails>(this.quotas);
  displayedColumns: Column[] = [Column.ProjectId, Column.CPU, Column.Memory, Column.Storage, Column.Actions];

  isLoading: boolean;
  readonly Column = Column;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private readonly _notificationService: NotificationService,
    private readonly _quotaService: QuotaService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._setSortConfig();

    this.isLoading = true;
    this._quotaService.quotas
      .pipe(
        filter(quotas => !_.isEqual(quotas, this.quotas)),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: quotas => {
          this.isLoading = false;
          this.quotas = quotas;
          this.dataSource.data = quotas;
        },
        error: _ => {
          this.isLoading = false;
        },
      });

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

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  addQuota(): void {
    this._matDialog.open<ProjectQuotaDialogComponent, QuotaDetails, never>(ProjectQuotaDialogComponent, {
      panelClass: 'km-quota-dialog',
    });
  }

  editQuota(quota: QuotaDetails): void {
    this._matDialog.open<ProjectQuotaDialogComponent, QuotaDetails, never>(ProjectQuotaDialogComponent, {
      panelClass: 'km-quota-dialog',
      data: quota,
    });
  }

  getprogressBarData(projectId: string, resourceType: string): progressBarData {
    const quota = this.quotas.find(quota => quota.subjectName === projectId);
    const progressBar: progressBarData = {
      color: '',
      value: 0,
      useageQuota: '',
    };
    if (quota) {
      const percentage = 100;
      switch (resourceType) {
        case 'cpu':
          progressBar.value =
            ((quota.status.globalUsage.cpu ? quota.status.globalUsage.cpu : 0) / quota.quota.cpu) * percentage;
          progressBar.color = this._getProgressBarAccent(progressBar.value);
          progressBar.useageQuota = `${quota.status.globalUsage.cpu ? quota.status.globalUsage.cpu : 0}/${
            quota.quota.cpu
          }`;
          return progressBar;
        case 'memory':
          progressBar.value =
            ((quota.status.globalUsage.memory ? quota.status.globalUsage.memory : 0) / quota.quota.memory) * percentage;
          progressBar.color = this._getProgressBarAccent(progressBar.value);
          progressBar.useageQuota = `${quota.status.globalUsage.memory ? quota.status.globalUsage.memory : 0}/${
            quota.quota.memory
          }`;
          return progressBar;
        case 'storage':
          progressBar.value =
            ((quota.status.globalUsage.storage ? quota.status.globalUsage.storage : 0) / quota.quota.storage) *
            percentage;
          progressBar.color = this._getProgressBarAccent(progressBar.value);
          progressBar.useageQuota = `${quota.status.globalUsage.storage ? quota.status.globalUsage.storage : 0}/${
            quota.quota.storage
          }`;

          return progressBar;
      }
    }
    return progressBar;
  }

  private _getProgressBarAccent(percentage: number): ThemePalette {
    const warn = 100;
    if (percentage >= warn) return 'warn';
    const accent = 70;
    if (percentage >= accent) return 'accent';
    return 'primary';
  }

  deleteQuota(quota: QuotaDetails): void {
    const {subjectHumanReadableName, name} = quota ?? {};

    const config = {
      data: {
        title: 'Delete Quota',
        message: `Delete quota for <b>${subjectHumanReadableName ?? name}</b>?`,
        confirmLabel: 'Delete',
      },
    } as MatDialogConfig;

    this._matDialog
      .open<ConfirmationDialogComponent, ConfirmationDialogConfig, boolean>(ConfirmationDialogComponent, config)
      .afterClosed()
      .pipe(
        filter(confirmed => confirmed),
        switchMap(_ => this._quotaService.deleteQuota(name))
      )
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${subjectHumanReadableName ?? name} quota`);
        this._quotaService.refreshQuotas();
      });
  }

  private _setSortConfig() {
    this.sort.active = Column.ProjectId;
    this.sort.direction = 'asc';

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case Column.ProjectId:
          return item.name;
        case Column.Memory:
          return item.quota?.memory;
        case Column.CPU:
          return item.quota?.cpu;
        case Column.Storage:
          return item.quota?.storage;
        default:
          return item[property];
      }
    };

    this.dataSource.sort = this.sort;
  }
}
