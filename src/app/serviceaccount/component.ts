// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
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
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ApiService} from '@core/services/api';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Project} from '@shared/entity/project';
import {ServiceAccount} from '@shared/entity/service-account';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {EMPTY, merge, of, Subject, timer} from 'rxjs';
import {catchError, filter, switchMap, switchMapTo, take, takeUntil} from 'rxjs/operators';
import {AddServiceAccountComponent} from './add-serviceaccount/component';
import {EditServiceAccountComponent} from './edit-serviceaccount/component';

@Component({
  selector: 'km-serviceaccount',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ServiceAccountComponent implements OnInit, OnChanges, OnDestroy {
  isInitializing = true;
  serviceAccounts: ServiceAccount[] = [];
  isShowToken = [];
  tokenList = [];
  isTokenInitializing = [];
  displayedColumns: string[] = ['stateArrow', 'name', 'group', 'creationDate', 'actions'];
  toggledColumns: string[] = ['token'];
  dataSource = new MatTableDataSource<ServiceAccount>();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private readonly _refreshTime = 10; // in seconds
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _serviceAccountUpdate: Subject<void> = new Subject<void>();
  private _selectedProject = {} as Project;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _matDialog: MatDialog,
    private readonly _appConfig: AppConfigService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.serviceAccounts;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    merge(this._serviceAccountUpdate, this._projectService.selectedProject.pipe(take(1)))
      .pipe(switchMapTo(this._projectService.selectedProject))
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(
        switchMap(userGroup => {
          this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);
          return this._apiService
            .getServiceAccounts(this._selectedProject.id)
            .pipe(catchError(() => of<ServiceAccount[]>([])));
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
    timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase())
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
      .pipe(take(1))
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
      .pipe(take(1))
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
        message: `Delete ${serviceAccount.name} from ${this._selectedProject.name} permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'deleteServiceAccountOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._apiService.deleteServiceAccount(this._selectedProject.id, serviceAccount)))
      .pipe(take(1))
      .subscribe(() => {
        delete this.tokenList[serviceAccount.id];
        this._serviceAccountUpdate.next();
        this._notificationService.success(
          `The ${serviceAccount.name} service account was removed from the ${this._selectedProject.name} project`
        );
        this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'ServiceAccountDeleted');
      });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.serviceAccounts) && this.paginator && this.serviceAccounts.length > this.paginator.pageSize;
  }
}
