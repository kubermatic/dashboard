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
import {ThemePalette} from '@angular/material/core';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {MatPaginator} from '@angular/material/paginator';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {takeUntil, filter, switchMap, tap, take} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {QuotaService} from './service';
import {UserService} from '@core/services/user';
import {QuotaDetails} from '@shared/entity/quota';
import _ from 'lodash';
import {ProjectQuotaDialogComponent} from './project-quota-dialog/component';
import {ConfirmationDialogComponent, ConfirmationDialogConfig} from '@shared/components/confirmation-dialog/component';
import {NotificationService} from '@core/services/notification';
import {getProgressBarAccent} from './utils/common';
import {DialogModeService} from '@app/core/services/dialog-mode';

enum Column {
  ProjectId = 'ProjectId',
  CPU = 'CPU',
  Memory = 'Memory',
  Storage = 'Storage',
  Actions = 'Actions',
}

enum ResourceType {
  CPU = 'cpu',
  Memory = 'memory',
  Storage = 'storage',
}

interface progressBarData {
  color: ThemePalette;
  value: number;
  usageQuota: string;
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
  readonly resourceType = ResourceType;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private readonly _notificationService: NotificationService,
    private readonly _quotaService: QuotaService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this._setSortConfig();

    this.isLoading = true;
    this._quotaService.quotas
      .pipe(
        tap(_ => (this.isLoading = false)),
        filter(quotas => !_.isEqual(quotas, this.quotas)),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: quotas => {
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
    this._dialogModeService.isEditDialog = true;
    this._matDialog
      .open<ProjectQuotaDialogComponent, QuotaDetails, never>(ProjectQuotaDialogComponent, {
        panelClass: 'km-quota-dialog',
        data: quota,
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  getProgressBarData(projectId: string, resourceType: string): progressBarData {
    const quota = this.quotas.find(quota => quota.subjectName === projectId);
    const progressBar: progressBarData = {
      color: 'primary',
      value: 0,
      usageQuota: '',
    };
    if (quota) {
      const percentage = 100;
      switch (resourceType) {
        case ResourceType.CPU:
          progressBar.value =
            ((quota.status.globalUsage.cpu ? quota.status.globalUsage.cpu : 0) / quota.quota.cpu) * percentage;
          progressBar.color = getProgressBarAccent(progressBar.value);
          progressBar.usageQuota = `${quota.status.globalUsage.cpu ? quota.status.globalUsage.cpu : 0}/${
            quota.quota.cpu
          }`;
          return progressBar;
        case ResourceType.Memory:
          progressBar.value =
            ((quota.status.globalUsage.memory ? quota.status.globalUsage.memory : 0) / quota.quota.memory) * percentage;
          progressBar.color = getProgressBarAccent(progressBar.value);
          progressBar.usageQuota = `${quota.status.globalUsage.memory ? quota.status.globalUsage.memory : 0}/${
            quota.quota.memory
          }`;
          return progressBar;
        case ResourceType.Storage:
          progressBar.value =
            ((quota.status.globalUsage.storage ? quota.status.globalUsage.storage : 0) / quota.quota.storage) *
            percentage;
          progressBar.color = getProgressBarAccent(progressBar.value);
          progressBar.usageQuota = `${quota.status.globalUsage.storage ? quota.status.globalUsage.storage : 0}/${
            quota.quota.storage
          }`;

          return progressBar;
      }
    }
    return progressBar;
  }

  deleteQuota(quota: QuotaDetails): void {
    const {subjectHumanReadableName, name} = quota ?? {};

    const config = {
      data: {
        title: 'Delete Quota',
        message: `Delete quota for <b>${_.escape(subjectHumanReadableName ?? name)}</b>?`,
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
