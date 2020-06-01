import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {first, takeUntil} from 'rxjs/operators';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {
  NodeProvider,
  NodeProviderConstants,
} from '../../../shared/model/NodeProviderConstants';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import * as countryCodeLookup from 'country-code-lookup';
import {DatacenterService, NotificationService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {Subject} from 'rxjs';
import {DatacenterDataDialogComponent} from './datacenter-data-dialog/datacenter-data-dialog.component';

@Component({
  selector: 'km-dynamic-datacenters',
  templateUrl: './dynamic-datacenters.component.html',
  styleUrls: ['./dynamic-datacenters.component.scss'],
})
export class DynamicDatacentersComponent implements OnInit, OnChanges {
  datacenters: DataCenterEntity[] = [];
  dataSource = new MatTableDataSource<DataCenterEntity>();
  displayedColumns: string[] = [
    'datacenter',
    'seed',
    'country',
    'provider',
    'actions',
  ];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  seeds: string[] = [];
  seedFilter: string;
  countries: string[] = [];
  countryFilter: string;
  providers: string[] = Object.values(NodeProvider).filter(
    provider => !!provider
  );
  providerFilter: string;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.datacenters;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'datacenter';
    this.sort.direction = 'asc';

    this.dataSource.sortingDataAccessor = (datacenter, property) => {
      switch (property) {
        case 'datacenter':
          return datacenter.metadata.name;
        case 'seed':
          return datacenter.spec.seed;
        case 'country':
          return this.getCountryName(datacenter.spec.country);
        case 'provider':
          return datacenter.spec.provider;
        default:
          return datacenter[property];
      }
    };

    this._datacenterService.datacenters
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenters => {
        this.datacenters = datacenters
          .filter(datacenter => !datacenter.seed)
          .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
        this._setSeeds();
        this._setCountries();
        this.filter();
      });

    this._settingsService.userSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => {
        this.paginator.pageSize = settings.itemsPerPage;
        this.dataSource.paginator = this.paginator; // Force refresh.
      });
  }

  ngOnChanges(): void {
    this.filter();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderName(provider: NodeProvider | string): string {
    return NodeProviderConstants.displayName(provider);
  }

  getCountryName(code: string): string {
    if (!code) {
      return '';
    }

    const country = countryCodeLookup.byIso(code);
    return country ? country.country : code;
  }

  private _setCountries() {
    this.countries = Array.from(
      new Set(this.datacenters.map(datacenter => datacenter.spec.country))
    ).sort((a, b) => a.localeCompare(b));
  }

  private _setSeeds() {
    this.seeds = Array.from(
      new Set(this.datacenters.map(datacenter => datacenter.spec.seed))
    ).sort((a, b) => a.localeCompare(b));
  }

  filter(): void {
    this.dataSource.data = this.datacenters.filter(datacenter => {
      let isVisible = true;

      if (this.countryFilter) {
        isVisible = isVisible && datacenter.spec.country === this.countryFilter;
      }

      if (this.seedFilter) {
        isVisible = isVisible && datacenter.spec.seed === this.seedFilter;
      }

      if (this.providerFilter) {
        isVisible =
          isVisible && datacenter.spec.provider === this.providerFilter;
      }

      return isVisible;
    });
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Datacenter',
        confirmLabel: 'Add',
      },
    };

    this._matDialog
      .open(DatacenterDataDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(first())
      .subscribe((result: DataCenterEntity) => {
        console.log(result);
      });
  }

  edit(datacenter: DataCenterEntity): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Datacenter',
        datacenter: datacenter,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog
      .open(DatacenterDataDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(first())
      .subscribe((result: DataCenterEntity) => {
        console.log(result);
      });
  }

  delete(datacenter: DataCenterEntity): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Datacenter',
        message: `Are you sure you want to delete the ${datacenter.metadata.name} datacenter?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(first())
      .subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this._datacenterService
            .deleteDatacenter(datacenter)
            .pipe(first())
            .subscribe(() => {
              this._notificationService.success(
                `The <strong>${datacenter.metadata.name}</strong> datacenter was deleted`
              );
              this._datacenterService.refreshDatacenters();
            });
        }
      });
  }

  isPaginatorVisible(): boolean {
    return (
      this.datacenters &&
      this.datacenters.length > 0 &&
      this.paginator &&
      this.datacenters.length > this.paginator.pageSize
    );
  }
}
