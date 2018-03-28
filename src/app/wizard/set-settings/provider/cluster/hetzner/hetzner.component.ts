import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { NgRedux } from '@angular-redux/store';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { HetznerCloudSpec } from 'app/shared/entity/cloud/HetznerCloudSpec';

import { InputValidationService } from 'app/core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';

@Component({
  selector: 'kubermatic-cluster-hetzner',
  templateUrl: './hetzner.component.html',
  styleUrls: ['./hetzner.component.scss']
})
export class HetznerClusterComponent implements OnInit, OnDestroy {


  public hetznerClusterForm: FormGroup;
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
    const clusterForm = reduxStore.wizard.hetznerClusterForm;

    this.hetznerClusterForm = this.formBuilder.group({
      access_token: [clusterForm.access_token, [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        ]],
    });

    this.onChange();

  }

  public onChange() {
    const hetznerCloudSpec = new HetznerCloudSpec(this.hetznerClusterForm.controls['access_token'].value);

    WizardActions.setValidation('clusterForm', this.hetznerClusterForm.valid);

    WizardActions.setCloudSpec(
      new CloudSpec(this.region, null, null, null, null, null, hetznerCloudSpec)
    );
  }

  public showRequiredFields() {
    if (this.hetznerClusterForm.invalid) {
      for (const i in this.hetznerClusterForm.controls) {
        if (this.hetznerClusterForm.controls.hasOwnProperty(i)) {
          this.hetznerClusterForm.get(i).markAsTouched();
        }
      }
    }
  }

  public ngOnDestroy(): void {
    this.sub && this.sub.unsubscribe();
  }
}
