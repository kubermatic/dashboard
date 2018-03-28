import { Subscription } from 'rxjs/Subscription';
import { NgRedux } from '@angular-redux/store';
import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AWSCloudSpec } from 'app/shared/entity/cloud/AWSCloudSpec';
import { InputValidationService } from 'app/core/services';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { ErrorStateMatcher } from '@angular/material';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'kubermatic-cluster-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AWSClusterComponent implements OnInit, OnDestroy {

  public awsClusterForm: FormGroup;
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
    const clusterForm = reduxStore.wizard.awsClusterForm;


    this.awsClusterForm = this.formBuilder.group({
      accessKeyId: [clusterForm.accessKeyId, [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secretAccessKey: [clusterForm.secretAccessKey, [<any>Validators.required, <any>Validators.minLength(2)]],
      vpcId: [clusterForm.vpcId],
      subnetId: [clusterForm.subnetId],
      routeTableId: [clusterForm.routeTableId],
      aws_cas: [clusterForm.aws_cas]
    });

    this.onChange();
  }

  public showRequiredFields() {
    if (this.awsClusterForm.invalid) {
      for (const i in this.awsClusterForm.controls) {
        if (this.awsClusterForm.controls.hasOwnProperty(i)) {
          this.awsClusterForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {
    const awsCloudSpec = new AWSCloudSpec(
      this.awsClusterForm.controls['accessKeyId'].value,
      this.awsClusterForm.controls['secretAccessKey'].value,
      this.awsClusterForm.controls['vpcId'].value,
      this.awsClusterForm.controls['subnetId'].value,
      this.awsClusterForm.controls['routeTableId'].value,
      '',
    );

    WizardActions.setValidation('clusterForm', this.awsClusterForm.valid);

    WizardActions.setCloudSpec(
      new CloudSpec(this.region, null, awsCloudSpec, null, null, null, null)
    );
  }

  public ngOnDestroy(): void {
    this.sub && this.sub.unsubscribe();
  }
}
