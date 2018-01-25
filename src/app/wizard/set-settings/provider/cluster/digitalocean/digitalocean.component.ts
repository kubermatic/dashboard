import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { NgRedux } from '@angular-redux/store';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { Component, OnInit, OnDestroy } from '@angular/core';
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

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  constructor(private formBuilder: FormBuilder,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    this.sub = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });

    const reduxStore = this.ngRedux.getState();
    const clusterForm = reduxStore.wizard.digitalOceanClusterForm;

    this.digitalOceanClusterForm = this.formBuilder.group({
      access_token: [clusterForm.access_token, [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern('[a-z0-9]+')]],
    });
  }

  public onChange() {
    const doCloudSpec = new DigitaloceanCloudSpec(this.digitalOceanClusterForm.controls['access_token'].value);

    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, doCloudSpec, null, null, null, null)
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
