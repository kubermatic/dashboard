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
import {SettingsService} from '@core/services/settings';
import {QuotaDetails} from '@shared/entity/quota';
import {UserService} from '@core/services/user';
import {MatSort} from '@angular/material/sort';
import {takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import _ from 'lodash';

enum Column {
  ProjectId = 'ProjectId',
  CPU = 'CPU',
  Memory = 'Memory',
  Storage = 'Storage',
  Spacer = 'Spacer',
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
  displayedColumns: string[] = [Column.ProjectId, Column.CPU, Column.Memory, Column.Storage, Column.Spacer];

  isLoading = true;
  readonly Column = Column;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(private readonly _settingsService: SettingsService, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this._setSortConfig();

    this._settingsService.quotas
      .pipe(
        tap(() => (this.isLoading = false)),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: quotas => {
          if (_.isEqual(quotas, this.quotas)) {
            return;
          }

          this.quotas = quotas;
          this.dataSource.data = quotas;
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
