import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { NgRedux } from '@angular-redux/store';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { DigitaloceanCloudSpec } from 'app/shared/entity/cloud/DigitialoceanCloudSpec';

import { InputValidationService } from 'app/core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';

@Component({
  selector: 'kubermatic-cluster-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanClusterComponent implements OnInit, OnDestroy {


  public digitalOceanClusterForm: FormGroup;
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
    const clusterForm = reduxStore.wizard.digitalOceanClusterForm;

    this.digitalOceanClusterForm = this.formBuilder.group({
      access_token: [clusterForm.access_token, [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern('[a-z0-9]+')]],
    });

    this.onChange();

  }

  public onChange() {
    const doCloudSpec = new DigitaloceanCloudSpec(this.digitalOceanClusterForm.controls['access_token'].value);

    WizardActions.setValidation('clusterForm', this.digitalOceanClusterForm.valid);

    WizardActions.setCloudSpec(
      new CloudSpec(this.region, doCloudSpec, null, null, null, null)
    );
  }

  public showRequiredFields() {
    if (this.digitalOceanClusterForm.invalid) {
      for (const i in this.digitalOceanClusterForm.controls) {
        if (this.digitalOceanClusterForm.controls.hasOwnProperty(i)) {
          this.digitalOceanClusterForm.get(i).markAsTouched();
        }
      }
    }
  }

  public ngOnDestroy(): void {
    this.sub && this.sub.unsubscribe();
  }
}
