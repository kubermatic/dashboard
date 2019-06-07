import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {AppConfigService} from '../../../../app-config.service';
import {ClusterService, UserService} from '../../../../core/services';
import {GoogleAnalyticsService} from '../../../../google-analytics.service';
import {NotificationActions} from '../../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';
import {SSHKeyEntity} from '../../../../shared/entity/SSHKeyEntity';
import {UserGroupConfig} from '../../../../shared/model/Config';

@Component({
  selector: 'kubermatic-edit-sshkeys-item',
  templateUrl: './edit-sshkeys-item.component.html',
  styleUrls: ['./edit-sshkeys-item.component.scss'],
})

export class EditSSHKeysItemComponent implements OnInit {
  @Input() index: number;
  @Input() sshKey: SSHKeyEntity;
  @Input() projectID: string;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  constructor(
      private readonly _dialog: MatDialog, private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _userService: UserService, private readonly _appConfigService: AppConfigService,
      private readonly _clusterService: ClusterService) {}

  ngOnInit(): void {
    this.userGroupConfig = this._appConfigService.getUserGroupConfig();
    this._userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });
  }

  deleteSshKey(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Remove SSH key from cluster',
        message: `You are on the way to remove the SSH key ${this.sshKey.name} from cluster ${
            this.cluster.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._dialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteSshKeyOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._clusterService
            .deleteSSHKey(this.projectID, this.cluster.id, this.datacenter.metadata.name, this.sshKey.id)
            .subscribe(() => {
              NotificationActions.success(
                  'Success', `SSH key ${this.sshKey.name} has been removed from cluster ${this.cluster.name}`);
              this._googleAnalyticsService.emitEvent('clusterOverview', 'SshKeyDeleted');
            });
      }
    });
  }
}
