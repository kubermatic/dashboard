import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import * as _ from 'lodash';
import * as countryCodeLookup from 'country-code-lookup';
import {Subject} from 'rxjs';
import {debounceTime, first, switchMap, takeUntil} from 'rxjs/operators';

import {DatacenterService, NotificationService} from '../../core/services';
import {UserService} from '../../core/services';
import {HistoryService} from '../../core/services/history/history.service';
import {SettingsService} from '../../core/services/settings/settings.service';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  AdminEntity,
  AdminSettings,
  ClusterTypeOptions,
} from '../../shared/entity/AdminSettings';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {objectDiff} from '../../shared/utils/common-utils';

import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';

@Component({
  selector: 'km-admin-settings',
  templateUrl: 'admin-settings.component.html',
  styleUrls: ['admin-settings.component.scss'],
})
export class AdminSettingsComponent implements OnInit, OnChanges, OnDestroy {
  user: MemberEntity;
  datacenters: DataCenterEntity[] = [];
  datacentersDataSource = new MatTableDataSource<DataCenterEntity>();
  datacentersDisplayedColumns: string[] = [
    'datacenter',
    'seed',
    'country',
    'provider',
    'hidden',
  ];
  @ViewChild('datacentersSort', {static: true}) datacentersSort: MatSort;
  @ViewChild('datacentersPaginator', {static: true})
  datacentersPaginator: MatPaginator;
  datacenterCountries: string[] = [];
  datacenterCountryFilter: string;
  admins: AdminEntity[] = [];
  adminsDataSource = new MatTableDataSource<AdminEntity>();
  adminsDisplayedColumns: string[] = ['name', 'email', 'actions'];
  @ViewChild('adminsSort', {static: true}) adminsSort: MatSort;
  @ViewChild('adminsPaginator', {static: true}) adminsPaginator: MatPaginator;
  selectedDistro = [];
  settings: AdminSettings; // Local settings copy. User can edit it.
  apiSettings: AdminSettings; // Original settings from the API. Cannot be edited by the user.
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _historyService: HistoryService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.adminsDataSource.data = this.admins;
    this.adminsDataSource.sort = this.adminsSort;
    this.adminsDataSource.paginator = this.adminsPaginator;
    this.adminsSort.active = 'name';
    this.adminsSort.direction = 'asc';

    this._settingsService.admins
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(admins => {
        this.admins = admins.sort((a, b) => a.email.localeCompare(b.email));
        this.adminsDataSource.data = this.admins;
      });

    this.datacentersDataSource.data = this.datacenters;
    this.datacentersDataSource.sort = this.datacentersSort;
    this.datacentersDataSource.paginator = this.datacentersPaginator;
    this.datacentersSort.active = 'datacenter';
    this.datacentersSort.direction = 'asc';

    this._datacenterService
      .getDataCenters()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenters => {
        this.datacenters = datacenters
          .filter(
            datacenter => !!datacenter.spec.country && !!datacenter.spec.seed
          )
          .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
        this.datacentersDataSource.data = this.datacenters;
        this.datacenterCountries = Array.from(
          new Set(this.datacenters.map(datacenter => datacenter.spec.country))
        );
      });

    this._userService.loggedInUser
      .pipe(first())
      .subscribe(user => (this.user = user));

    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => {
        if (!_.isEqual(settings, this.apiSettings)) {
          if (
            this.apiSettings &&
            !_.isEqual(
              this.apiSettings,
              this._settingsService.defaultAdminSettings
            )
          ) {
            this._notificationService.success(
              'The settings update was applied'
            );
          }
          this._applySettings(settings);
        }
      });

    this._settingsChange
      .pipe(
        debounceTime(500),
        switchMap(() =>
          this._settingsService.patchAdminSettings(this._getPatch())
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe(_ => {});

    this._settingsService.userSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => {
        this.adminsPaginator.pageSize = settings.itemsPerPage;
        this.adminsDataSource.paginator = this.adminsPaginator; // Force refresh.

        this.datacentersPaginator.pageSize = settings.itemsPerPage;
        this.datacentersDataSource.paginator = this.datacentersPaginator; // Force refresh.
      });
  }

  ngOnChanges(): void {
    this.adminsDataSource.data = this.admins;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _applySettings(settings: AdminSettings): void {
    this.apiSettings = settings;
    this.settings = _.cloneDeep(this.apiSettings);
    this._setDistro(this.settings.clusterTypeOptions);
  }

  private _getPatch(): AdminSettings {
    const patch: AdminSettings = objectDiff(this.settings, this.apiSettings);

    if (patch.customLinks) {
      patch.customLinks = this.settings.customLinks;
    }

    return patch;
  }

  onSettingsChange(): void {
    this._settingsChange.next();
  }

  onDistroChange(group: MatButtonToggleGroup): void {
    this.settings.clusterTypeOptions = this._getDistro(group);
    this.onSettingsChange();
  }

  private _getDistro(group: MatButtonToggleGroup): ClusterTypeOptions {
    const isKubernetesSelected =
      group.value && group.value.indexOf('kubernetes') > -1;
    const isOpenshiftSelected =
      group.value && group.value.indexOf('openshift') > -1;

    if (isKubernetesSelected && isOpenshiftSelected) {
      return ClusterTypeOptions.All;
    } else if (isKubernetesSelected) {
      return ClusterTypeOptions.Kubernetes;
    } else {
      return ClusterTypeOptions.OpenShift;
    }
  }

  private _setDistro(distro: ClusterTypeOptions): void {
    switch (distro) {
      case ClusterTypeOptions.All:
        this.selectedDistro = ['kubernetes', 'openshift'];
        break;
      case ClusterTypeOptions.Kubernetes:
        this.selectedDistro = ['kubernetes'];
        break;
      case ClusterTypeOptions.OpenShift:
        this.selectedDistro = ['openshift'];
        break;
    }
  }

  isLastDistro(group: MatButtonToggleGroup, distro: string): boolean {
    return (
      group.value && group.value.length <= 1 && group.value.indexOf(distro) > -1
    );
  }

  resetDefaults(): void {
    this.settings = this._settingsService.defaultAdminSettings;
    this.onSettingsChange();
  }

  goBack(): void {
    this._historyService.goBack('/projects');
  }

  isEqual(a: any, b: any): boolean {
    return _.isEqual(a, b);
  }

  isDisplayLinksEqual(): boolean {
    return (
      this.isEqual(
        this.settings.displayAPIDocs,
        this.apiSettings.displayAPIDocs
      ) &&
      this.isEqual(
        this.settings.displayDemoInfo,
        this.apiSettings.displayDemoInfo
      ) &&
      this.isEqual(
        this.settings.displayTermsOfService,
        this.apiSettings.displayTermsOfService
      )
    );
  }

  getCountryName(code: string): string {
    const country = countryCodeLookup.byIso(code);
    return country ? country.country : code;
  }

  isDeleteAdminEnabled(admin: AdminEntity): boolean {
    return !!this.user && admin.email !== this.user.email;
  }

  deleteAdmin(admin: AdminEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Admin',
        message: `Are you sure you want to take admin rights from ${admin.name}?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(first())
      .subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          admin.isAdmin = false;
          this._settingsService
            .setAdmin(admin)
            .pipe(first())
            .subscribe(() => {
              this._notificationService.success(
                `The <strong>${admin.name}</strong> user was deleted from admin group`
              );
              this._settingsService.refreshAdmins();
            });
        }
      });
  }

  addAdmin(): void {
    this._matDialog
      .open(AddAdminDialogComponent)
      .afterClosed()
      .pipe(first())
      .subscribe(admin => {
        if (admin) {
          this._settingsService.refreshAdmins();
        }
      });
  }

  hasItems(): boolean {
    return this.admins && this.admins.length > 0;
  }

  isAdminsPaginatorVisible(): boolean {
    return (
      this.hasItems() &&
      this.adminsPaginator &&
      this.admins.length > this.adminsPaginator.pageSize
    );
  }

  isDatacentersPaginatorVisible(): boolean {
    return (
      this.hasItems() &&
      this.datacentersPaginator &&
      this.admins.length > this.datacentersPaginator.pageSize
    );
  }
}
