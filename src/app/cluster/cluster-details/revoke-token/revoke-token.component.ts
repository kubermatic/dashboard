import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {RevokeAdminTokenComponent} from './revoke-admin-token/revoke-admin-token.component';
import {RevokeViewerTokenComponent} from './revoke-viewer-token/revoke-viewer-token.component';

@Component({
  selector: 'kubermatic-revoke-token',
  templateUrl: './revoke-token.component.html',
})

export class RevokeTokenComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  private _currentGroupConfig: GroupConfig;
  private _currentUserGroup: string;

  constructor(private readonly _matDialog: MatDialog, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this._userService.currentUserGroup(this.projectID).subscribe(userGroup => {
      this._currentUserGroup = userGroup;
      this._currentGroupConfig = this._userService.userGroupConfig(userGroup);
    });
  }

  isRevokeAdminTokenEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.edit;
  }

  revokeAdminToken(): void {
    const dialogRef = this._matDialog.open(RevokeAdminTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }

  isRevokeViewerTokenEnabled(): boolean {
    return !this._currentUserGroup || this._currentUserGroup === 'owners' || this._currentUserGroup === 'editors';
  }

  revokeViewerToken(): void {
    const dialogRef = this._matDialog.open(RevokeViewerTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }
}
