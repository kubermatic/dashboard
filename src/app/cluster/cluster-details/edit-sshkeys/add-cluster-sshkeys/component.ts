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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '@core/services/api/service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {UserService} from '@core/services/user/service';
import {AddSshKeyDialogComponent} from '@shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {Cluster} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {SSHKey} from '@shared/entity/ssh-key';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

@Component({
  selector: 'km-add-cluster-sshkeys',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() seed: string;
  @Input() sshKeys: SSHKey[] = [];

  keys: SSHKey[] = [];
  keysForm: FormGroup = new FormGroup({
    keys: new FormControl('', [Validators.required]),
  });
  private keysSub: Subscription;
  private _currentGroupConfig: GroupConfig;
  private _user: Member;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _dialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _dialogRef: MatDialogRef<AddClusterSSHKeysComponent>,
    private readonly _api: ApiService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(first()).subscribe(user => (this._user = user));
    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this.reloadKeys();
  }

  ngOnDestroy(): void {
    if (this.keysSub) {
      this.keysSub.unsubscribe();
    }
  }

  reloadKeys(): void {
    this.keysSub = this._api.getSSHKeys(this.projectID).subscribe(sshKeysRes => {
      const newKeys: SSHKey[] = [];
      for (const i in sshKeysRes) {
        if (!this.sshKeys.find(x => x.name === sshKeysRes[i].name)) {
          newKeys.push(sshKeysRes[i]);
        }
      }
      this.keys = _.sortBy(newKeys, k => k.name.toLowerCase());
    });
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Create);
  }

  addClusterSSHKeys(): void {
    this._clusterService
      .createSSHKey(this.projectID, this.cluster.id, this.keysForm.controls.keys.value)
      .subscribe(res => {
        this._notificationService.success(
          `The <strong>${this.keysForm.controls.keys.value}</strong> SSH key was added to the <strong>${this.cluster.name}</strong> cluster`
        );
        this._dialogRef.close(res);
      });
  }

  addProjectSSHKeys(): void {
    const dialogRef = this._dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.projectID;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.keysSub) {
          this.keysSub.unsubscribe();
        }

        this.reloadKeys();
        this.keysForm.setValue({keys: result.id});
      }
    });
  }
}
