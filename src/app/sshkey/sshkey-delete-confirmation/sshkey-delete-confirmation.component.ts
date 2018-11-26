import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-sshkey-delete-confirmation',
  templateUrl: './sshkey-delete-confirmation.component.html',
  styleUrls: ['./sshkey-delete-confirmation.component.scss'],
})

export class SSHKeyDeleteConfirmationComponent {
  @Input() projectId: string;
  @Input() sshKey: SSHKeyEntity;

  constructor(private api: ApiService, private dialogRef: MatDialogRef<SSHKeyDeleteConfirmationComponent>) {}

  deleteSSHKey(): void {
    this.api.deleteSSHKey(this.sshKey.id, this.projectId).subscribe((result) => {
      NotificationActions.success('Success', `SSH key has been removed from project`);
    });
    this.dialogRef.close(true);
  }
}
