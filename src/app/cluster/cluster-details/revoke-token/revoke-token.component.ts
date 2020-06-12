import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {ApiService, NotificationService, UserService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {Datacenter} from '../../../shared/entity/datacenter';
import {Member} from '../../../shared/entity/Member';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';

@Component({
  selector: 'km-revoke-token',
  templateUrl: './revoke-token.component.html',
  styleUrls: ['./revoke-token.component.scss'],
})
export class RevokeTokenComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() datacenter: Datacenter;
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
    this._userService.loggedInUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService.currentUserGroup(this.projectID).subscribe(userGroup => {
      this._currentGroupConfig = this._userService.userGroupConfig(userGroup);
    });
  }

  isRevokeTokenEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'clusters', Permission.Edit);
  }

  revokeToken(): void {
    if (this.revokeAdminToken) {
      this._apiService
        .editToken(this.cluster, this.datacenter.metadata.name, this.projectID, {token: ''})
        .subscribe(res => {
          this._notificationService.success(
            `The admin token for the <strong>${this.cluster.name}</strong> cluster was revoked`
          );
          this._matDialogRef.close(res);
        });
    }

    if (this.revokeViewerToken) {
      this._apiService
        .editViewerToken(this.cluster, this.datacenter.metadata.name, this.projectID, {token: ''})
        .subscribe(res => {
          this._notificationService.success(
            `The viewer token for the <strong>${this.cluster.name}</strong> cluster was revoked`
          );
          this._matDialogRef.close(res);
        });
    }
  }
}
