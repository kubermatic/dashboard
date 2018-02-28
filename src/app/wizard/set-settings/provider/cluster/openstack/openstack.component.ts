import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { NgRedux, select } from '@angular-redux/store';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpenstackCloudSpec } from 'app/shared/entity/cloud/OpenstackCloudSpec';
import { InputValidationService } from 'app/core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-cluster-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterComponent implements OnInit, OnDestroy {


  public osClusterForm: FormGroup;
  private sub: Subscription;
  private region: string = '';

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;
  @select(['wizard', 'setDatacenterForm', 'datacenter']) datacenter$: Observable<DataCenterEntity>;

  constructor(private formBuilder: FormBuilder,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    this.sub = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
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
    const osCloudSpec = new OpenstackCloudSpec(
      this.osClusterForm.controls['os_username'].value,
      this.osClusterForm.controls['os_password'].value,
      this.osClusterForm.controls['os_tenant'].value,
      this.osClusterForm.controls['os_domain'].value,
      this.osClusterForm.controls['os_network'].value,
      this.osClusterForm.controls['os_security_groups'].value,
      this.osClusterForm.controls['os_floating_ip_pool'].value,
    );

    WizardActions.setValidation('clusterForm', this.osClusterForm.valid);

    WizardActions.setCloudSpec(
      new CloudSpec(this.region, null, null, null, osCloudSpec, null)
    );
  }

  public ngOnDestroy(): void {
    this.sub && this.sub.unsubscribe();
  }
}
