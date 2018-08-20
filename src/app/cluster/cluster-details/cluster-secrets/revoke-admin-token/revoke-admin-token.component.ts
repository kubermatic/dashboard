import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { ClusterEntity, Token } from '../../../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-revoke-admin-token',
  templateUrl: './revoke-admin-token.component.html',
  styleUrls: ['./revoke-admin-token.component.scss']
})

export class RevokeAdminTokenComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() project: ProjectEntity;
  public adminToken: Token = { token: '' };

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<RevokeAdminTokenComponent>) {}

  ngOnInit() { }

  public revokeAdminToken() {
    this.api.editToken(this.cluster, this.datacenter.metadata.name, this.project.id, this.adminToken).subscribe(res => {
      NotificationActions.success('Success', `Revoke Admin Token successfully`);
      this.dialogRef.close(res);
    });
  }
}
