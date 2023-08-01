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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {DynamicTab} from '@shared/model/dynamic-tab';
import {AllowedRegistriesService} from './service';
import {UserService} from '@core/services/user';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {AllowedRegistry} from './entity';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {AllowedRegistryDialog} from './allowed-registry-dialog/component';
import {DialogActionMode} from '@shared/types/common';
import {DialogModeService} from '@app/core/services/dialog-mode';

@Component({
  selector: 'km-allowed-registries-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AllowedRegistriesComponent extends DynamicTab implements OnInit, OnChanges, OnDestroy {
  allowedRegistries: AllowedRegistry[] = [];
  dataSource = new MatTableDataSource<AllowedRegistry>();
  displayedColumns: string[] = ['name', 'registryPrefix', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _allowedRegistriesService: AllowedRegistriesService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {
    super();
  }

  ngOnInit() {
    this.dataSource.data = this.allowedRegistries;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._allowedRegistriesService.allowedRegistries.pipe(takeUntil(this._unsubscribe)).subscribe(allowedRegistries => {
      this.allowedRegistries = allowedRegistries;
      this.dataSource.data = this.allowedRegistries;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.allowedRegistries) {
      this.dataSource.data = this.allowedRegistries;
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.allowedRegistries &&
      this.allowedRegistries.length > 0 &&
      this.paginator &&
      this.allowedRegistries.length > this.paginator.pageSize
    );
  }

  hasNoData(): boolean {
    return _.isEmpty(this.allowedRegistries);
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Allowed Registry',
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(AllowedRegistryDialog, dialogConfig);
  }

  edit(allowedRegistry: AllowedRegistry): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Allowed Registry',
        allowedRegistry: allowedRegistry,
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._dialogModeService.isEditDialog = true;
    this._matDialog
      .open(AllowedRegistryDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  delete(allowedRegistry: AllowedRegistry): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Allowed Registry',
        message: `Delete <b>${allowedRegistry.name}</b> allowed registry permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._allowedRegistriesService.deleteAllowedRegistry(allowedRegistry.name)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${allowedRegistry.name} allowed registry`);
        this._allowedRegistriesService.refreshAllowedRegistries();
      });
  }
}
