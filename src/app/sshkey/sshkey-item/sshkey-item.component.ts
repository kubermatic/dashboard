import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {ApiService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-sshkey-item',
  templateUrl: './sshkey-item.component.html',
  styleUrls: ['./sshkey-item.component.scss'],
})

export class SSHKeyItemComponent implements OnInit {
  @Input() index: number;
  @Input() sshKey: SSHKeyEntity;
  @Input() projectId: string;
  @Input() isOdd: boolean;

  isShowPublicKey = false;
  publicKeyName: string;
  publicKey: string;

  constructor(
      public dialog: MatDialog, private api: ApiService, private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.publicKeyName = this.sshKey.spec.publicKey.split(' ')[0];
    this.publicKey = this.sshKey.spec.publicKey.slice(this.publicKeyName.length + 1, -1);
  }

  getSshKeyItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'km-odd';
    }
  }

  deleteSshKey(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        dialogId: 'km-delete-sshkey-dialog',
        title: 'Remove SSH key from project',
        message:
            'You are on the way to remove the SSH key ${this.sshKey.name} from the project. This cannot be undone!',
        confirmLabel: 'Delete',
        confirmLabelId: 'km-delete-sshkey-dialog-btn',
        cancelLabel: 'Close',
        cancelLabelId: 'km-close-sshkey-dialog-btn',
        verifyName: false,
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('sshKeyOverview', 'deleteSshKeyOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteSSHKey(this.sshKey.id, this.projectId).subscribe(() => {
          NotificationActions.success('Success', 'SSH key has been removed from project');
          this.googleAnalyticsService.emitEvent('sshKeyOverview', 'SshKeyDeleted');
        });
      }
    });
  }

  togglePublicKey(): void {
    this.isShowPublicKey = !this.isShowPublicKey;
  }
}
