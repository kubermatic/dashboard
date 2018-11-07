import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ApiService } from '../../../../core/services';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ClusterEntity, Token } from '../../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-revoke-admin-token',
  templateUrl: './revoke-admin-token.component.html',
  styleUrls: ['./revoke-admin-token.component.scss'],
})

export class RevokeAdminTokenComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  public adminToken: Token = { token: '' };

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<RevokeAdminTokenComponent>) {}

  ngOnInit(): void { }

  public revokeAdminToken(): void {
    this.api.editToken(this.cluster, this.datacenter.metadata.name, this.projectID, this.adminToken).subscribe((res) => {
      NotificationActions.success('Success', `Revoke Admin Token successfully`);
      this.dialogRef.close(res);
    });
  }
}
