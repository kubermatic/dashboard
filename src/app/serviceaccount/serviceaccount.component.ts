// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {filter, first, switchMap, switchMapTo, takeUntil} from 'rxjs/operators';
import * as _ from 'lodash';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Project} from '../shared/entity/project';
import {ServiceAccount} from '../shared/entity/service-account';
import {GroupConfig} from '../shared/model/Config';
import {MemberUtils} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';

import {AddServiceAccountComponent} from './add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from './edit-serviceaccount/edit-serviceaccount.component';

@Component({
  selector: 'km-serviceaccount',
  templateUrl: './serviceaccount.component.html',
  styleUrls: ['./serviceaccount.component.scss'],
})
export class ServiceAccountComponent implements OnInit, OnChanges, OnDestroy {
  isInitializing = true;
  serviceAccounts: ServiceAccount[] = [];
  isShowToken = [];
  tokenList = [];
  isTokenInitializing = [];
  displayedColumns: string[] = ['stateArrow', 'status', 'name', 'group', 'creationDate', 'actions'];
  toggledColumns: string[] = ['token'];
  dataSource = new MatTableDataSource<ServiceAccount>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe: Subject<any> = new Subject();
  private _serviceAccountUpdate: Subject<any> = new Subject();
  private _selectedProject = {} as Project;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _matDialog: MatDialog,
    private readonly _appConfig: AppConfigService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.serviceAccounts;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    merge(this._serviceAccountUpdate, this._projectService.selectedProject.pipe(first()))
      .pipe(switchMapTo(this._projectService.selectedProject))
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        })
      )
      .pipe(
        switchMap(userGroup => {
          this._currentGroupConfig = this._userService.userGroupConfig(userGroup);
          return this._apiService.getServiceAccounts(this._selectedProject.id);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(serviceaccounts => {
        this.serviceAccounts = serviceaccounts;
        this.dataSource.data = this.serviceAccounts;
        this.isInitializing = false;
      });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.serviceAccounts;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getStateIconClass(status: string): string {
    return ProjectUtils.getStateIconClass(status);
  }

  getGroupDisplayName(group: string): string {
    return MemberUtils.getGroupDisplayName(group);
  }

  isEnabled(action: string): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.serviceaccounts[action];
  }

  toggleToken(element: ServiceAccount): void {
    this.isShowToken[element.id] = !this.isShowToken[element.id];
    if (this.isShowToken) {
      this.getTokenList(element);
      this.isTokenInitializing[element.id] = true;
    }
  }

  getTokenList(serviceaccount: ServiceAccount): void {
    this.tokenList[serviceaccount.id] = [];
    timer(0, 10 * this._appConfig.getRefreshTimeBase())
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(() =>
          this.tokenList[serviceaccount.id]
            ? this._apiService.getServiceAccountTokens(this._selectedProject.id, serviceaccount)
            : EMPTY
        )
      )
      .subscribe(tokens => {
        this.tokenList[serviceaccount.id] = tokens;
        this.isTokenInitializing[serviceaccount.id] = false;
      });
  }

  addServiceAccount(): void {
    const modal = this._matDialog.open(AddServiceAccountComponent);
    modal.componentInstance.project = this._selectedProject;

    modal
      .afterClosed()
      .pipe(first())
      .subscribe(isAdded => {
        if (isAdded) {
          this._serviceAccountUpdate.next();
        }
      });
  }

  editServiceAccount(serviceAccount: ServiceAccount, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(EditServiceAccountComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.serviceaccount = serviceAccount;
    modal
      .afterClosed()
      .pipe(first())
      .subscribe(isEdited => {
        if (isEdited) {
          this._serviceAccountUpdate.next();
        }
      });
  }

  deleteServiceAccount(serviceAccount: ServiceAccount, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Service Account',
        message: `Delete "<strong>${serviceAccount.name}</strong>" from "<strong>${this._selectedProject.name}</strong>" permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'deleteServiceAccountOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._apiService.deleteServiceAccount(this._selectedProject.id, serviceAccount)))
      .pipe(first())
      .subscribe(() => {
        delete this.tokenList[serviceAccount.id];
        this._serviceAccountUpdate.next();
        this._notificationService.success(
          `The <strong>${serviceAccount.name}</strong> service account was removed from the <strong>${this._selectedProject.name}</strong> project`
        );
        this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'ServiceAccountDeleted');
      });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.serviceAccounts) && this.paginator && this.serviceAccounts.length > this.paginator.pageSize;
  }
}
