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
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SSHKeyService} from '@core/services/ssh-key';
import {UserService} from '@core/services/user';
import {AddSshKeyDialogComponent} from '@shared/components/add-ssh-key-dialog/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {SSHKey} from '@shared/entity/ssh-key';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Subject, timer} from 'rxjs';
import {filter, retry, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-sshkey',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class SSHKeyComponent implements OnInit, OnChanges, OnDestroy {
  loading = true;
  sshKeys: SSHKey[] = [];
  userGroup: string;
  project: Project;
  isShowPublicKey = [];
  displayedColumns: string[] = ['stateArrow', 'name', 'fingerprint', 'creationTimestamp', 'actions'];
  toggledColumns: string[] = ['publickey'];
  dataSource = new MatTableDataSource<SSHKey>();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private readonly _refreshTime = 10;

  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private readonly _sshKeyService: SSHKeyService,
    private readonly _userService: UserService,
    private readonly _appConfigService: AppConfigService,
    public dialog: MatDialog,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _projectService: ProjectService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.sshKeys;
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this.project = project;
          return this._userService.getCurrentUserGroup(this.project.id);
        })
      )
      .pipe(
        switchMap(group => {
          this.userGroup = group;
          this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(group);
          return timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase());
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this.refreshSSHKeys());
  }

  ngOnChanges(): void {
    this.dataSource.data = this.sshKeys;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getPublicKeyName(sshKey: SSHKey): string {
    return sshKey.spec.publicKey.split(' ')[0];
  }

  getPublicKey(sshKey: SSHKey): string {
    return sshKey.spec.publicKey.slice(this.getPublicKeyName(sshKey).length + 1, -1);
  }

  refreshSSHKeys(): void {
    const retries = 3;
    this._sshKeyService
      .list(this.project.id)
      .pipe(retry(retries))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(res => {
        this.sshKeys = res;
        this.dataSource.data = this.sshKeys;
        this.loading = false;
      });
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Create);
  }

  addSshKey(): void {
    const dialogRef = this.dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.project.id;

    dialogRef.afterClosed().subscribe(result => {
      result && this.refreshSSHKeys();
    });
  }

  canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Delete);
  }

  deleteSshKey(sshKey: SSHKey, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogId: 'km-delete-sshkey-dialog',
        title: 'Delete SSH Key',
        message: `Delete <b>${_.escape(sshKey.name)}</b> SSH key of <b>${_.escape(this.project.name)}</b> project permanently?`,
        confirmLabel: 'Delete',
        confirmLabelId: 'km-delete-sshkey-dialog-btn',
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('sshKeyOverview', 'deleteSshKeyOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._sshKeyService.delete(sshKey.id, this.project.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`Removed the ${sshKey.name} SSH key from the ${this.project.id} project`);
        this._googleAnalyticsService.emitEvent('sshKeyOverview', 'SshKeyDeleted');
      });
  }

  togglePublicKey(element: SSHKey): void {
    this.isShowPublicKey[element.id] = !this.isShowPublicKey[element.id];
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.sshKeys) && this.paginator && this.sshKeys.length > this.paginator.pageSize;
  }
}
