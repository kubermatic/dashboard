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

import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {ApiService, NotificationService, UserService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {View} from '../../../shared/entity/common';
import {Member} from '../../../shared/entity/member';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';

@Component({
  selector: 'km-revoke-token',
  templateUrl: './revoke-token.component.html',
  styleUrls: ['./revoke-token.component.scss'],
})
export class RevokeTokenComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() seed: string;
  @Input() projectID: string;
  revokeAdminToken = false;
  revokeViewerToken = false;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _matDialogRef: MatDialogRef<RevokeTokenComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _userService: UserService,
    private readonly _apiService: ApiService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService.getCurrentUserGroup(this.projectID).subscribe(userGroup => {
      this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);
    });
  }

  isRevokeTokenEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  revokeToken(): void {
    if (this.revokeAdminToken) {
      this._apiService.editToken(this.cluster, this.seed, this.projectID, {token: ''}).subscribe(res => {
        this._notificationService.success(
          `The admin token for the <strong>${this.cluster.name}</strong> cluster was revoked`
        );
        this._matDialogRef.close(res);
      });
    }

    if (this.revokeViewerToken) {
      this._apiService.editViewerToken(this.cluster, this.seed, this.projectID, {token: ''}).subscribe(res => {
        this._notificationService.success(
          `The viewer token for the <strong>${this.cluster.name}</strong> cluster was revoked`
        );
        this._matDialogRef.close(res);
      });
    }
  }
}
