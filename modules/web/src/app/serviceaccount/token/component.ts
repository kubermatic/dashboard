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

import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
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
import {filter, switchMap, take} from 'rxjs/operators';

@Component({
  selector: 'km-serviceaccount-token',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class ServiceAccountTokenComponent implements OnInit {
  @Input() serviceaccount: ServiceAccount;
  @Input() serviceaccountTokens: ServiceAccountToken[];
  @Input() isInitializing: boolean;
  @Output() onUpdate = new EventEmitter<void>();
  displayedColumns: string[] = ['name', 'expiry', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountToken>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _selectedProject: Project;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _serviceAccountService: ServiceAccountService,
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

  createToken(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
        serviceAccount: this.serviceaccount,
        mode: ServiceAccountTokenDialogMode.Create,
      } as ServiceAccountTokenDialogData,
    };

    this._matDialog
      .open(ServiceAccountTokenDialog, config)
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => this.onUpdate.next());
  }

  regenerateToken(token: ServiceAccountToken): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
        serviceAccount: this.serviceaccount,
        mode: ServiceAccountTokenDialogMode.Regenerate,
        token: token,
      } as ServiceAccountTokenDialogData,
    };

    this._matDialog.open(ServiceAccountTokenDialog, config);
  }

  editToken(token: ServiceAccountToken): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
        serviceAccount: this.serviceaccount,
        mode: ServiceAccountTokenDialogMode.Edit,
        token: token,
      } as ServiceAccountTokenDialogData,
    };

    this._matDialog.open(ServiceAccountTokenDialog, config);
  }

  deleteToken(token: ServiceAccountToken): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Token',
        message: `Delete <b>${token.name}</b> token of <b>${this.serviceaccount.name}</b> service account of <b>${this._selectedProject.name}</b> project permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'deleteServiceAccountTokenOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ => this._serviceAccountService.deleteToken(this._selectedProject.id, this.serviceaccount, token))
      )
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `Removed the ${token.name} token from the ${this.serviceaccount.name} service account`
        );
        this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenDeleted');
        this.onUpdate.next();
      });
  }
}
