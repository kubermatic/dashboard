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

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {ProjectService} from '@core/services/project/service';
import {UserService} from '@core/services/user/service';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Project} from '@shared/entity/project';
import {ServiceAccount, ServiceAccountToken} from '@shared/entity/service-account';
import {GroupConfig} from '@shared/model/Config';
import {filter, switchMap, take} from 'rxjs/operators';
import {AddServiceAccountTokenComponent} from './add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from './edit-serviceaccount-token/edit-serviceaccount-token.component';
import {TokenDialogComponent} from './token-dialog/token-dialog.component';

@Component({
  selector: 'km-serviceaccount-token',
  templateUrl: './serviceaccount-token.component.html',
  styleUrls: ['./serviceaccount-token.component.scss'],
})
export class ServiceAccountTokenComponent implements OnInit {
  @Input() serviceaccount: ServiceAccount;
  @Input() serviceaccountTokens: ServiceAccountToken[];
  @Input() isInitializing: boolean;
  displayedColumns: string[] = ['name', 'expiry', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountToken>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _selectedProject: Project;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(take(1))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));
  }

  getDataSource(): MatTableDataSource<ServiceAccountToken> {
    this.dataSource.data = this.serviceaccountTokens ? this.serviceaccountTokens : [];
    return this.dataSource;
  }

  isEnabled(action: string): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.serviceaccountToken[action];
  }

  addServiceAccountToken(): void {
    const modal = this._matDialog.open(AddServiceAccountTokenComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.serviceaccount = this.serviceaccount;
  }

  regenerateServiceAccountToken(token: ServiceAccountToken): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Regenerate Token',
        message: `Regenerate ${token.name} token for ${this.serviceaccount.name} service account?`,
        confirmLabel: 'Regenerate',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'regenerateServiceAccountTokenOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ =>
          this._apiService.regenerateServiceAccountToken(this._selectedProject.id, this.serviceaccount, token)
        )
      )
      .pipe(take(1))
      .subscribe(token => {
        this.openTokenDialog(token);
        this._notificationService.success(`The ${token.name} token was regenerated`);
        this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenRegenerated');
      });
  }

  editServiceAccountToken(token: ServiceAccountToken): void {
    const modal = this._matDialog.open(EditServiceAccountTokenComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.serviceaccount = this.serviceaccount;
    modal.componentInstance.token = token;
  }

  deleteServiceAccountToken(token: ServiceAccountToken): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Token',
        message: `Delete ${token.name} token from ${this.serviceaccount.name} service account permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'deleteServiceAccountTokenOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ => this._apiService.deleteServiceAccountToken(this._selectedProject.id, this.serviceaccount, token))
      )
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `The ${token.name} token was removed from the ${this.serviceaccount.name} service account`
        );
        this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenDeleted');
      });
  }

  openTokenDialog(token: ServiceAccountToken): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
  }
}
