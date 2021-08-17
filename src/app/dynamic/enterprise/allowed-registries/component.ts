import {Component, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DynamicTab} from '@shared/model/dynamic-tab';
import {AllowedRegistriesService} from './service';
import {UserService} from '@core/services/user';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {AllowedRegistry} from './entity';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {Mode, AllowedRegistryDialog} from './allowed-registry-dialog/component';

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
    private readonly _matDialog: MatDialog
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
        mode: Mode.Add,
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
        mode: Mode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(AllowedRegistryDialog, dialogConfig);
  }

  delete(allowedRegistry: AllowedRegistry): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Allowed Registry',
        message: `Are you sure you want to delete the allowed registry ${allowedRegistry.name}?`,
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
        this._notificationService.success(`The constraint template ${allowedRegistry.name} was deleted`);
        this._allowedRegistriesService.refreshAllowedRegistries();
      });
  }
}
