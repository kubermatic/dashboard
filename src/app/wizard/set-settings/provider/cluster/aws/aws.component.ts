import { NgRedux } from '@angular-redux/store';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AWSCloudSpec } from 'app/shared/entity/cloud/AWSCloudSpec';
import { InputValidationService } from 'app/core/services';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { ErrorStateMatcher } from '@angular/material';

@Component({
  selector: 'kubermatic-cluster-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AWSClusterComponent implements OnInit {
  public awsClusterForm: FormGroup;

  constructor(private formBuilder: FormBuilder,
    public inputValidationService: InputValidationService,
    private ngRedux: NgRedux<any>) { }

  ngOnInit() {
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
  }

  public showRequiredFields(event: any) {
    if (this.awsClusterForm.invalid) {
      for (const i in event.clusterForm.awsClusterForm) {
        if (event.clusterForm.awsClusterForm.hasOwnProperty(i)) {
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

    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, null, awsCloudSpec, null, null, null)
    );
  }
}
