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

import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {SSHKeyService} from '@core/services/ssh-key';
import {UserService} from '@core/services/user';
import {AddSshKeyDialogComponent} from '@shared/components/add-ssh-key-dialog/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {SSHKey} from '@shared/entity/ssh-key';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {EMPTY, Observer, Subject, merge, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'km-edit-sshkeys',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class EditSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  loading = true;
  clusterSSHKeys: SSHKey[] = [];
  projectSSHKeys: SSHKey[] = [];
  displayedColumns: string[] = ['name', 'actions'];
  dataSource = new MatTableDataSource<SSHKey>();

  private readonly _refreshTime = 10;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe = new Subject<void>();
  private _sshKeysUpdate = new Subject<void>();

  private get _sshKeyUpdateObserver(): Observer<SSHKey> {
    return {
      next: _ => this._sshKeysUpdate.next(),
      error: _ => this._sshKeysUpdate.next(),
      complete: _ => this._sshKeysUpdate.next(),
    } as Observer<SSHKey>;
  }

  constructor(
    private readonly _userService: UserService,
    private readonly _appConfig: AppConfigService,
    private readonly _dialog: MatDialog,
    private readonly _clusterService: ClusterService,
    private readonly _sshKeyService: SSHKeyService,
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
        this.clusterSSHKeys = sshkeys;
        this.loading = false;
      });

    merge(timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase()), this._sshKeysUpdate)
      .pipe(switchMap(_ => this._sshKeyService.list(this.projectID)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(sshkeys => (this.projectSSHKeys = sshkeys));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<SSHKey> {
    this.dataSource.data = this.clusterSSHKeys;
    return this.dataSource;
  }

  isTableVisible(): boolean {
    return !_.isEmpty(this.clusterSSHKeys);
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Create);
  }

  canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Delete);
  }

  deleteSSHKey(sshKey: SSHKey): void {
    sshKey.deletionTimestamp = new Date();
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Remove SSH Key',
        message: `Remove <b>${sshKey.name}</b>
          SSH key from <b>${this.cluster.name}</b> cluster?`,
        confirmLabel: 'Remove',
      },
    };

    const dialogRef = this._dialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(tap(isConfirmed => (!isConfirmed ? (sshKey.deletionTimestamp = undefined) : undefined)))
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._clusterService.deleteSSHKey(this.projectID, this.cluster.id, sshKey.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`Removed the ${sshKey.name} SSH key from the ${this.cluster.name} cluster`);
        this._sshKeysUpdate.next();
      });
  }

  sshKeysToAdd(): SSHKey[] {
    const existing = new Set(this.clusterSSHKeys.map(key => key.id));
    return this.projectSSHKeys.filter(key => !existing.has(key.id));
  }

  onSSHKeyAdd(keyID: string): void {
    this.loading = true;
    const sshKey = this.projectSSHKeys.find(key => key.id === keyID);
    if (!sshKey) {
      return;
    }

    this._clusterService
      .createSSHKey(this.projectID, this.cluster.id, keyID)
      .pipe(take(1))
      .subscribe(this._sshKeyUpdateObserver);
  }

  createSSHKey(): void {
    this.loading = true;
    const dialogRef = this._dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.projectID;
    dialogRef.componentInstance.title = 'Add SSH Key to the Project';
    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap((key: SSHKey) => this._clusterService.createSSHKey(this.projectID, this.cluster.id, key.id)))
      .pipe(take(1))
      .subscribe(this._sshKeyUpdateObserver);
  }
}
