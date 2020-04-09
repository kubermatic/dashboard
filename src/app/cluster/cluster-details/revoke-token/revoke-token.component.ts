import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

import {ApiService, NotificationService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {GroupConfig} from '../../../shared/model/Config';

@Component({
  selector: 'km-revoke-token',
  templateUrl: './revoke-token.component.html',
  styleUrls: ['./revoke-token.component.scss'],
})

export class RevokeTokenComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  revokeAdminToken = false;
  revokeViewerToken = false;
  private _currentGroupConfig: GroupConfig;
  private _currentUserGroup: string;

  constructor(
      private readonly _matDialogRef: MatDialogRef<RevokeTokenComponent>,
      private readonly _notificationService: NotificationService, private readonly _userService: UserService,
      private readonly _apiService: ApiService) {}

  ngOnInit(): void {
    this._userService.currentUserGroup(this.projectID).subscribe(userGroup => {
      this._currentUserGroup = userGroup;
      this._currentGroupConfig = this._userService.userGroupConfig(userGroup);
    });
  }

  isRevokeAdminTokenEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.edit;
  }

  isRevokeViewerTokenEnabled(): boolean {
    return !this._currentUserGroup || this._currentUserGroup === 'owners' || this._currentUserGroup === 'editors';
  }

  revokeToken(): void {
    if (this.revokeAdminToken) {
      this._apiService.editToken(this.cluster, this.datacenter.metadata.name, this.projectID, {token: ''})
          .subscribe((res) => {
            this._notificationService.success(`Successfully revoked Admin Token for cluster ${this.cluster.name}`);
            this._matDialogRef.close(res);
          });
    }

    if (this.revokeViewerToken) {
      this._apiService.editViewerToken(this.cluster, this.datacenter.metadata.name, this.projectID, {token: ''})
          .subscribe((res) => {
            this._notificationService.success(`Successfully revoked Viewer Token for cluster ${this.cluster.name}`);
            this._matDialogRef.close(res);
          });
    }
  }
}
