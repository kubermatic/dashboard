import {Component, OnInit, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {OpenstackCloudSpec} from "../../../api/entitiy/cloud/OpenstackCloudSpec";

import {InputValidationService} from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterComponent implements OnInit {
  public osClusterForm: FormGroup;
  public cloudSpec: OpenstackCloudSpec;

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }
  @Input() cloud: OpenstackCloudSpec;
  @Output() syncProviderCloudSpec = new EventEmitter();
  @Output() syncProviderCloudSpecValid = new EventEmitter();

  ngOnInit() {
    this.osClusterForm = this.formBuilder.group({
      os_tenant: [this.cloud.tenant, [<any>Validators.required]],
      os_domain: [this.cloud.domain, [<any>Validators.required]],
      os_username: [this.cloud.username, [<any>Validators.required]],
      os_password: [this.cloud.password, [<any>Validators.required]],
      os_network: [this.cloud.network],
      os_security_groups: [this.cloud.securityGroups],
      os_floating_ip_pool: [this.cloud.floatingIpPool],
      os_cas: [false]
    });
  }

  public onChange (){
    this.cloudSpec = new OpenstackCloudSpec(
      this.osClusterForm.controls["os_username"].value,
      this.osClusterForm.controls["os_password"].value,
      this.osClusterForm.controls["os_tenant"].value,
      this.osClusterForm.controls["os_domain"].value,
      this.osClusterForm.controls["os_network"].value,
      this.osClusterForm.controls["os_security_groups"].value,
      this.osClusterForm.controls["os_floating_ip_pool"].value,
    )

    this.syncProviderCloudSpec.emit(this.cloudSpec);
    this.syncProviderCloudSpecValid.emit(this.osClusterForm.valid);
  }
}
