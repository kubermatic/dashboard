import { NgRedux } from '@angular-redux/store';
import { CloudSpec } from './../../../../shared/entity/ClusterEntity';
import {Component, OnInit, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {OpenstackCloudSpec} from "../../../../shared/entity/cloud/OpenstackCloudSpec";

import {InputValidationService} from '../../../../core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-cluster-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterComponent implements OnInit {
  public osClusterForm: FormGroup;

  constructor(private formBuilder: FormBuilder, 
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }
  @Input() cloud: OpenstackCloudSpec;
  @Output() syncProviderCloudSpec = new EventEmitter();

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

  public onChange() {
    const osCloudSpec = new OpenstackCloudSpec(
      this.osClusterForm.controls["os_username"].value,
      this.osClusterForm.controls["os_password"].value,
      this.osClusterForm.controls["os_tenant"].value,
      this.osClusterForm.controls["os_domain"].value,
      this.osClusterForm.controls["os_network"].value,
      this.osClusterForm.controls["os_security_groups"].value,
      this.osClusterForm.controls["os_floating_ip_pool"].value,
    );

    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, null, null, null, osCloudSpec, null)
    );

    this.syncProviderCloudSpec.emit(osCloudSpec);
  }
}
