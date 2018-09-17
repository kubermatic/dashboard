import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ApiService } from '../../../../core/services';
import { SSHKeyEntity } from '../../../../shared/entity/SSHKeyEntity';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { EditSSHKeyDeleteConfirmationComponent } from './../edit-sshkey-delete-confirmation/edit-sshkey-delete-confirmation.component';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-edit-sshkeys-item',
  templateUrl: './edit-sshkeys-item.component.html',
  styleUrls: ['./edit-sshkeys-item.component.scss'],
})

export class EditSSHKeysItemComponent {
  @Input() index: number;
  @Input() sshKey: SSHKeyEntity;
  @Input() projectId: string;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  constructor(private apiService: ApiService,
              public dialog: MatDialog) { }

  public getSshKeyItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'odd';
    }
  }

  public deleteSshKey() {
    const modal = this.dialog.open(EditSSHKeyDeleteConfirmationComponent);
    modal.componentInstance.projectId = this.projectId;
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.sshKey = this.sshKey;
    const sub = modal.afterClosed().subscribe(deleted => {
      sub.unsubscribe();
    });
  }

}
