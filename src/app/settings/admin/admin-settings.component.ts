import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, first, switchMap, takeUntil} from 'rxjs/operators';

import {UserService} from '../../core/services';
import {HistoryService} from '../../core/services/history/history.service';
import {SettingsService} from '../../core/services/settings/settings.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {AdminEntity, AdminSettings, ClusterTypeOptions} from '../../shared/entity/AdminSettings';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {objectDiff} from '../../shared/utils/common-utils';
import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';

@Component({
  selector: 'kubermatic-admin-settings',
  templateUrl: 'admin-settings.component.html',
  styleUrls: ['admin-settings.component.scss'],
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  user: MemberEntity;
  admins = [];
  dataSource = new MatTableDataSource<AdminEntity>();
  displayedColumns: string[] = ['name', 'email', 'actions'];
  selectedDistro = [];
  settings: AdminSettings;     // Local settings copy. User can edit it.
  apiSettings: AdminSettings;  // Original settings from the API. Cannot be edited by the user.
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _userService: UserService, private readonly _settingsService: SettingsService,
      private readonly _historyService: HistoryService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this._userService.loggedInUser.pipe(first()).subscribe(user => this.user = user);

    this._settingsService.admins.pipe(takeUntil(this._unsubscribe)).subscribe(admins => {
      this.admins = admins;
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings) {
          NotificationActions.success('Successfully applied external settings update');
        }
        this._applySettings(settings);
      }
    });

    this._settingsChange.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._settingsService.patchAdminSettings(objectDiff(this.settings, this.apiSettings))))
        .subscribe(settings => this._applySettings(settings));
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

  onSettingsChange(): void {
    this._settingsChange.next();
  }

  onDistroChange(group: MatButtonToggleGroup): void {
    this.settings.clusterTypeOptions = this._getDistro(group);
    this.onSettingsChange();
  }

  private _getDistro(group: MatButtonToggleGroup): ClusterTypeOptions {
    const isKubernetesSelected = group.value && group.value.indexOf('kubernetes') > -1;
    const isOpenshiftSelected = group.value && group.value.indexOf('openshift') > -1;

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
    return group.value && group.value.length <= 1 && group.value.indexOf(distro) > -1;
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

  getDataSource(): MatTableDataSource<AdminEntity> {
    this.dataSource.data = this.admins;
    return this.dataSource;
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

    this._matDialog.open(ConfirmationDialogComponent, dialogConfig)
        .afterClosed()
        .pipe(first())
        .subscribe((isConfirmed: boolean) => {
          if (isConfirmed) {
            admin.isAdmin = false;
            this._settingsService.setAdmin(admin).pipe(first()).subscribe(() => {
              NotificationActions.success(`${admin.name} was deleted from admin group`);
              this._settingsService.refreshAdmins();
            });
          }
        });
  }

  addAdmin(): void {
    this._matDialog.open(AddAdminDialogComponent).afterClosed().pipe(first()).subscribe((admin) => {
      if (admin) {
        this._settingsService.refreshAdmins();
      }
    });
  }
}
