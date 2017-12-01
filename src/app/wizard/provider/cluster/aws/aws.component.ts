import { NgRedux } from '@angular-redux/store';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AWSCloudSpec } from "../../../../shared/entity/cloud/AWSCloudSpec";
import { InputValidationService } from '../../../../core/services';
import { CloudSpec } from "../../../../shared/entity/ClusterEntity";
import { WizardActions } from 'app/redux/actions/wizard.actions';


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
    const cloud = reduxStore.wizard.cloudSpec.aws;

    this.awsClusterForm = this.formBuilder.group({
      accessKeyId: [cloud.accessKeyId, [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secretAccessKey: [cloud.secretAccessKey, [<any>Validators.required, <any>Validators.minLength(2)]],
      vpcId: [cloud.vpcId],
      subnetId: [cloud.subnetId],
      routeTableId: [cloud.routeTableId],
      aws_cas: [false]
    });
  }

  public onChange() {
    const awsCloudSpec = new AWSCloudSpec(
      this.awsClusterForm.controls["accessKeyId"].value,
      this.awsClusterForm.controls["secretAccessKey"].value,
      this.awsClusterForm.controls["vpcId"].value,
      this.awsClusterForm.controls["subnetId"].value,
      this.awsClusterForm.controls["routeTableId"].value,
      "",
    );

    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, null, awsCloudSpec, null, null, null)
    );
  }
}
