import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationsService} from 'angular2-notifications';

import {ApiService} from '../../../../core/services';
import {ClusterEntity, Token} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-revoke-admin-token',
  templateUrl: './revoke-admin-token.component.html',
})

export class RevokeAdminTokenComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  adminToken: Token = {token: ''};

  constructor(
      private api: ApiService, private dialogRef: MatDialogRef<RevokeAdminTokenComponent>,
      private readonly _notificationService: NotificationsService) {}

  revokeAdminToken(): void {
    this.api.editToken(this.cluster, this.datacenter.metadata.name, this.projectID, this.adminToken)
        .subscribe((res) => {
          this._notificationService.success(`Successfully revoked Admin Token for cluster ${this.cluster.name}`);
          this.dialogRef.close(res);
        });
  }
}
