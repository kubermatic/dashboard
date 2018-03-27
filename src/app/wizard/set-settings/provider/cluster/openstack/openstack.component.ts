import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { NgRedux, select } from '@angular-redux/store';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputValidationService } from 'app/core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { OpenstackCloudSpec } from '../../../../../shared/entity/cloud/OpenstackCloudSpec';

@Component({
  selector: 'kubermatic-cluster-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterComponent implements OnInit, OnDestroy {


  public osClusterForm: FormGroup;
  private sub: Subscription;
  private region = '';

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;
  @select(['wizard', 'setDatacenterForm', 'datacenter']) datacenter$: Observable<DataCenterEntity>;

  constructor(private formBuilder: FormBuilder,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) {
  }

  ngOnInit() {
    this.sub = this.isChecked$.subscribe(isChecked => {
      if (isChecked) {
        this.showRequiredFields();
      }
    });

    this.sub = this.datacenter$.subscribe(datacenter => {
      this.region = datacenter.metadata.name;
    });

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

    this.onChange();
  }

  public showRequiredFields() {
    if (this.osClusterForm.invalid) {
      for (const i in this.osClusterForm.controls) {
        if (this.osClusterForm.controls.hasOwnProperty(i)) {
          this.osClusterForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {
    const osCloudSpec: OpenstackCloudSpec = {
      username: this.osClusterForm.controls['os_username'].value,
      password: this.osClusterForm.controls['os_password'].value,
      tenant: this.osClusterForm.controls['os_tenant'].value,
      domain: this.osClusterForm.controls['os_domain'].value,
      network: this.osClusterForm.controls['os_network'].value,
      securityGroups: this.osClusterForm.controls['os_security_groups'].value,
      floatingIpPool: this.osClusterForm.controls['os_floating_ip_pool'].value,
    };

    WizardActions.setValidation('clusterForm', this.osClusterForm.valid);

    WizardActions.setCloudSpec({
      dc: this.region,
      openstack: osCloudSpec,
    });
  }

  public ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
