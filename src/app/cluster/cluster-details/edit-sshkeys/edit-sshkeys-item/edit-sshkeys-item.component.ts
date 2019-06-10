import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {AppConfigService} from '../../../../app-config.service';
import {ApiService, UserService} from '../../../../core/services';
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
      public dialog: MatDialog, private api: ApiService, private googleAnalyticsService: GoogleAnalyticsService,
      private userService: UserService, private appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
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
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteSshKeyOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteClusterSSHKey(this.sshKey.id, this.cluster.id, this.datacenter.metadata.name, this.projectID)
            .subscribe(() => {
              NotificationActions.success(
                  'Success', `SSH key ${this.sshKey.name} has been removed from cluster ${this.cluster.name}`);
              this.googleAnalyticsService.emitEvent('clusterOverview', 'SshKeyDeleted');
            });
      }
    });
  }
}
