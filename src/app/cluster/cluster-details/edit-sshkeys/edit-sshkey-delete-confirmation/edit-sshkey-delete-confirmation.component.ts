import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ApiService } from '../../../../core/services';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { SSHKeyEntity } from '../../../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-edit-sshkey-delete-confirmation',
  templateUrl: './edit-sshkey-delete-confirmation.component.html',
  styleUrls: ['./edit-sshkey-delete-confirmation.component.scss']
})

export class EditSSHKeyDeleteConfirmationComponent {
  @Input() projectID: string;
  @Input() sshKey: SSHKeyEntity;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<EditSSHKeyDeleteConfirmationComponent>) {
  }

  deleteClusterSSHKey(): void {
    this.api.deleteClusterSSHKey(this.sshKey.id, this.cluster.id, this.datacenter.metadata.name, this.projectID).subscribe(() => {
      NotificationActions.success('Success', `SSH key has been removed from cluster`);
    });
    this.dialogRef.close(true);
  }
}
