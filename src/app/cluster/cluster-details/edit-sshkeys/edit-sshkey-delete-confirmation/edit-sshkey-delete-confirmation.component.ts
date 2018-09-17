import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services';
import { SSHKeyEntity } from '../../../../shared/entity/SSHKeyEntity';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-edit-sshkey-delete-confirmation',
  templateUrl: './edit-sshkey-delete-confirmation.component.html',
  styleUrls: ['./edit-sshkey-delete-confirmation.component.scss']
})

export class EditSSHKeyDeleteConfirmationComponent {
  @Input() projectId: string;
  @Input() sshKey: SSHKeyEntity;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<EditSSHKeyDeleteConfirmationComponent>) {
  }

  deleteClusterSSHKey() {
    this.api.deleteClusterSSHKey(this.sshKey.id, this.cluster.id, this.datacenter.metadata.name, this.projectId).subscribe(result => {
      NotificationActions.success('Success', `SSH key has been removed from cluster`);
    });
    this.dialogRef.close(true);
  }
}
