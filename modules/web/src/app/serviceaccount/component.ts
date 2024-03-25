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
import {DialogModeService} from '@app/core/services/dialog-mode';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {
  ServiceAccountTokenDialog,
  ServiceAccountTokenDialogData,
  ServiceAccountTokenDialogMode,
} from '@app/serviceaccount/token/add/component';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {ServiceAccountService} from '@core/services/service-account';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Project} from '@shared/entity/project';
import {ServiceAccount, ServiceAccountToken} from '@shared/entity/service-account';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils} from '@shared/utils/member';
import _ from 'lodash';
import {Subject, merge, of, timer} from 'rxjs';
import {catchError, filter, switchMap, switchMapTo, take, takeUntil} from 'rxjs/operators';
import {CreateServiceAccountDialogComponent} from './create-dialog/component';
import {EditServiceAccountDialogComponent} from './edit-dialog/component';

class TokenList {
  initializing = true;
  visible = false;
  tokens: ServiceAccountToken[] = [];
  unsubscribe = new Subject<void>();
  onChange = new Subject<void>();
}

enum Column {
  StateArrow = 'stateArrow',
  Name = 'name',
  Group = 'group',
  CreationDate = 'creationDate',
  Actions = 'actions',
}

@Component({
  selector: 'km-serviceaccount',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ServiceAccountComponent implements OnInit, OnChanges, OnDestroy {
  readonly Column = Column;

  isInitializing = true;
  serviceAccounts: ServiceAccount[] = [];
  displayedColumns: string[] = ['stateArrow', 'name', 'group', 'creationDate', 'actions'];
  toggleableColumns: string[] = ['token'];
  dataSource = new MatTableDataSource<ServiceAccount>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _refreshTime = 10;

  private _unsubscribe: Subject<void> = new Subject<void>();
  private _serviceAccountUpdate: Subject<void> = new Subject<void>();
  private _selectedProject = {} as Project;
  private _currentGroupConfig: GroupConfig;
  private _tokenMap = new Map<string, TokenList>();

  constructor(
    private readonly _serviceAccountService: ServiceAccountService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _matDialog: MatDialog,
    private readonly _appConfig: AppConfigService,
    private readonly _notificationService: NotificationService,
    private _dialogModeService: DialogModeService
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
          return this._serviceAccountService
            .get(this._selectedProject.id)
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

  createToken(serviceAccount: ServiceAccount, $event: Event): void {
    $event.preventDefault();
    $event.stopPropagation();

    this._loadTokens(serviceAccount);
    this.getTokenList(serviceAccount.id).visible = false;

    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
        serviceAccount: serviceAccount,
        mode: ServiceAccountTokenDialogMode.Create,
      } as ServiceAccountTokenDialogData,
    };

    this._matDialog
      .open(ServiceAccountTokenDialog, config)
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => this.onTokenChange(serviceAccount.id));
  }

  getGroupDisplayName(group: string): string {
    return MemberUtils.getGroupDisplayName(group);
  }

  isEnabled(action: string): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.serviceaccounts[action];
  }

  isTokenVisible(id: string): boolean {
    return this._tokenMap.get(id)?.visible;
  }

  isTokenInitializing(id: string): boolean {
    return this._tokenMap.get(id)?.initializing;
  }

  getTokenList(id: string): TokenList {
    return this._tokenMap.get(id);
  }

  getTokens(id: string): ServiceAccountToken[] {
    return this._tokenMap.get(id)?.tokens;
  }

  toggleToken(serviceAccount: ServiceAccount): void {
    this.isTokenVisible(serviceAccount.id) ? this._hideToken(serviceAccount) : this._showToken(serviceAccount);
  }

  onTokenChange(id: string): void {
    this._tokenMap.get(id).onChange.next();
  }

  createServiceAccount(): void {
    const modal = this._matDialog.open(CreateServiceAccountDialogComponent);
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
    this._dialogModeService.isEditDialog = true;
    const modal = this._matDialog.open(EditServiceAccountDialogComponent);
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
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  deleteServiceAccount(serviceAccount: ServiceAccount, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Service Account',
        message: `Delete <b>${serviceAccount.name}</b> service account of <b>${this._selectedProject.name}</b> project permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._serviceAccountService.delete(this._selectedProject.id, serviceAccount)))
      .pipe(take(1))
      .subscribe(() => {
        this._hideToken(serviceAccount);
        this._serviceAccountUpdate.next();
        this._notificationService.success(
          `Removed the ${serviceAccount.name} service account from the ${this._selectedProject.name} project`
        );
        this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'ServiceAccountDeleted');
      });

    this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'deleteServiceAccountOpened');
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.serviceAccounts) && this.paginator && this.serviceAccounts.length > this.paginator.pageSize;
  }

  private _loadTokens(serviceAccount: ServiceAccount): void {
    if (!this._tokenMap.has(serviceAccount.id)) {
      this._tokenMap.set(serviceAccount.id, new TokenList());
    }

    this.getTokenList(serviceAccount.id).visible = true;
    merge(
      timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase()),
      this._tokenMap.get(serviceAccount.id).onChange
    )
      .pipe(takeUntil(this.getTokenList(serviceAccount.id).unsubscribe))
      .pipe(switchMap(() => this._serviceAccountService.getTokens(this._selectedProject.id, serviceAccount)))
      .subscribe(tokens => {
        this.getTokenList(serviceAccount.id).tokens = tokens;
        this.getTokenList(serviceAccount.id).initializing = false;
      });
  }

  private _showToken(serviceAccount: ServiceAccount): void {
    this._loadTokens(serviceAccount);
  }

  private _hideToken(serviceAccount: ServiceAccount): void {
    this._tokenMap.get(serviceAccount.id)?.unsubscribe.next();
    this._tokenMap.get(serviceAccount.id)?.unsubscribe.complete();
    this._tokenMap.delete(serviceAccount.id);
  }
}
