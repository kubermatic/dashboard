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

@Component({
  selector: 'km-dynamic-datacenters',
  templateUrl: './dynamic-datacenters.component.html',
  styleUrls: ['./dynamic-datacenters.component.scss'],
})
export class DynamicDatacentersComponent implements OnInit, OnChanges {
  datacenters: DataCenterEntity[] = [];
  datacentersDataSource = new MatTableDataSource<DataCenterEntity>();
  datacentersDisplayedColumns: string[] = [
    'datacenter',
    'seed',
    'country',
    'provider',
    'actions',
  ];
  @ViewChild('datacentersSort', {static: true}) datacentersSort: MatSort;
  @ViewChild('datacentersPaginator', {static: true})
  datacentersPaginator: MatPaginator;
  datacenterSeeds: string[] = [];
  datacenterSeedFilter: string;
  datacenterCountries: string[] = [];
  datacenterCountryFilter: string;
  datacenterProviders: string[] = Object.values(NodeProvider).filter(
    provider => !!provider
  );
  datacenterProviderFilter: string;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.datacentersDataSource.data = this.datacenters;
    this.datacentersDataSource.sort = this.datacentersSort;
    this.datacentersDataSource.paginator = this.datacentersPaginator;
    this.datacentersSort.active = 'datacenter';
    this.datacentersSort.direction = 'asc';

    this.datacentersDataSource.sortingDataAccessor = (datacenter, property) => {
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
        this._setDatacenterSeeds();
        this._setDatacenterCountries();
        this.filterDatacenters();
      });

    this._settingsService.userSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => {
        this.datacentersPaginator.pageSize = settings.itemsPerPage;
        this.datacentersDataSource.paginator = this.datacentersPaginator; // Force refresh.
      });
  }

  ngOnChanges(): void {
    this.datacentersDataSource.data = this.datacenters;
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

  private _setDatacenterCountries() {
    this.datacenterCountries = Array.from(
      new Set(this.datacenters.map(datacenter => datacenter.spec.country))
    ).sort((a, b) => a.localeCompare(b));
  }

  private _setDatacenterSeeds() {
    this.datacenterSeeds = Array.from(
      new Set(this.datacenters.map(datacenter => datacenter.spec.seed))
    ).sort((a, b) => a.localeCompare(b));
  }

  filterDatacenters(): void {
    this.datacentersDataSource.data = this.datacenters.filter(datacenter => {
      let isVisible = true;

      if (this.datacenterCountryFilter) {
        isVisible =
          isVisible && datacenter.spec.country === this.datacenterCountryFilter;
      }

      if (this.datacenterSeedFilter) {
        isVisible =
          isVisible && datacenter.spec.seed === this.datacenterSeedFilter;
      }

      if (this.datacenterProviderFilter) {
        isVisible =
          isVisible &&
          datacenter.spec.provider === this.datacenterProviderFilter;
      }

      return isVisible;
    });
  }

  deleteDatacenter(datacenter: DataCenterEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
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

  hasItems(): boolean {
    return this.datacenters && this.datacenters.length > 0;
  }

  isDatacentersPaginatorVisible(): boolean {
    return (
      this.hasItems() &&
      this.datacentersPaginator &&
      this.datacenters.length > this.datacentersPaginator.pageSize
    );
  }
}
