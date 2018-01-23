import { NgRedux } from '@angular-redux/store';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpenstackCloudSpec } from 'app/shared/entity/cloud/OpenstackCloudSpec';
import { InputValidationService } from 'app/core/services';
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

  ngOnInit() {
    const reduxStore = this.ngRedux.getState();
    const clusterForm = reduxStore.wizard.openstackClusterForm;

    this.osClusterForm = this.formBuilder.group({
      os_tenant: [clusterForm.os_tenant, [<any>Validators.required]],
      os_domain: [clusterForm.os_domain, [<any>Validators.required]],
      os_username: [clusterForm.os_username, [<any>Validators.required]],
      os_password: [clusterForm.os_password, [<any>Validators.required]],
      os_network: [clusterForm.os_network],
      os_security_groups: [clusterForm.os_security_groups],
      os_floating_ip_pool: [clusterForm.os_floating_ip_pool],
      os_cas: [clusterForm.os_cas]
    });
  }

  public showRequiredFields(event: any) {
    if (this.osClusterForm.invalid) {
      for (const i in event.clusterForm.openstackClusterForm) {
        if (event.clusterForm.openstackClusterForm.hasOwnProperty(i)) {
          this.osClusterForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {
    const osCloudSpec = new OpenstackCloudSpec(
      this.osClusterForm.controls['os_username'].value,
      this.osClusterForm.controls['os_password'].value,
      this.osClusterForm.controls['os_tenant'].value,
      this.osClusterForm.controls['os_domain'].value,
      this.osClusterForm.controls['os_network'].value,
      this.osClusterForm.controls['os_security_groups'].value,
      this.osClusterForm.controls['os_floating_ip_pool'].value,
    );

    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, null, null, null, osCloudSpec, null)
    );
  }
}
