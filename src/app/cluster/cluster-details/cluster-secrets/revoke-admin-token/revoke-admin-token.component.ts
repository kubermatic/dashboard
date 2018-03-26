import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services/api/api.service';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-revoke-admin-token',
  templateUrl: './revoke-admin-token.component.html',
  styleUrls: ['./revoke-admin-token.component.scss']
})

export class RevokeAdminTokenComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public disableRevoke: boolean = true;
  public revokeAdminTokenForm: FormGroup;
  public pattern: string = '[bcdfghjklmnpqrstvwxz2456789]{6}.[bcdfghjklmnpqrstvwxz2456789]{16}';

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit() {
    this.revokeAdminTokenForm = this.fb.group({
      adminToken: ['', Validators.pattern(this.pattern)]
    });
  }

  onChange(event: any) {
    if ((this.revokeAdminTokenForm.controls['adminToken'].value).match(this.pattern)) {
      this.disableRevoke = false;
    } else {
      this.disableRevoke = true;
    }
  }

  public revokeAdminToken() {
    if (!this.disableRevoke) {
      this.cluster.address.adminToken = this.revokeAdminTokenForm.controls['adminToken'].value;
      this.api.editCluster(this.cluster, this.datacenter.spec.seed).subscribe(res => {
        NotificationActions.success('Success', `Revoke Admin Token successfully`);
      });
    }
  }
}
