import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
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
  public revokeAdminTokenForm: FormGroup;
  public pattern: string = '[bcdfghjklmnpqrstvwxz2456789]{6}.[bcdfghjklmnpqrstvwxz2456789]{16}';

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit() {
    this.revokeAdminTokenForm = this.fb.group({
      adminToken: ['', Validators.pattern('[bcdfghjklmnpqrstvwxz2456789]{6}.[bcdfghjklmnpqrstvwxz2456789]{16}')]
    });
  }

  public revokeAdminToken() {
  }
}
