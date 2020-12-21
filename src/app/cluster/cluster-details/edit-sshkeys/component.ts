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

import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {UserService} from '@core/services/user/service';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {SSHKey} from '@shared/entity/ssh-key';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {filter, take, switchMap, takeUntil} from 'rxjs/operators';
import {AddClusterSSHKeysComponent} from './add-cluster-sshkeys/component';

@Component({
  selector: 'km-edit-sshkeys',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EditSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  loading = true;
  sshKeys: SSHKey[] = [];
  displayedColumns: string[] = ['name', 'actions'];
  dataSource = new MatTableDataSource<SSHKey>();

  private readonly _refreshTime = 5; // in seconds
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe: Subject<any> = new Subject();
  private _sshKeysUpdate: Subject<any> = new Subject();

  constructor(
    private readonly _userService: UserService,
    private readonly _appConfig: AppConfigService,
    private readonly _dialog: MatDialog,
    private readonly _clusterService: ClusterService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    merge(timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase()), this._sshKeysUpdate)
      .pipe(switchMap(() => (this.projectID ? this._clusterService.sshKeys(this.projectID, this.cluster.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(sshkeys => {
        this.sshKeys = sshkeys;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<SSHKey> {
    this.dataSource.data = this.sshKeys;
    return this.dataSource;
  }

  isTableVisible(): boolean {
    return !_.isEmpty(this.sshKeys);
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Create);
  }

  addSshKey(): void {
    const dialogRef = this._dialog.open(AddClusterSSHKeysComponent);
    dialogRef.componentInstance.projectID = this.projectID;
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.sshKeys = this.sshKeys;

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((sshkey: SSHKey) => {
        if (sshkey) {
          this.sshKeys.push(sshkey);
          this._sshKeysUpdate.next();
        }
      });
  }

  canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Delete);
  }

  deleteSshKey(sshKey: SSHKey): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete SSH Key',
        message: `Are you sure you want to permanently delete the ${sshKey.name}
          SSH key from the ${this.cluster.name} cluster?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._dialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteSshKeyOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._clusterService.deleteSSHKey(this.projectID, this.cluster.id, sshKey.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `The ${sshKey.name} SSH key was removed from the ${this.cluster.name} cluster`
        );
        this._googleAnalyticsService.emitEvent('clusterOverview', 'SshKeyDeleted');
      });
  }
}
