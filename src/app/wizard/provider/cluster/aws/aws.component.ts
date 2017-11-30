import { NgRedux } from '@angular-redux/store';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() cloud: AWSCloudSpec;

  constructor(private formBuilder: FormBuilder,
    public inputValidationService: InputValidationService,
    private ngRedux: NgRedux<any>) { }

  @Output() syncProviderCloudSpec = new EventEmitter();

  ngOnInit() {
    this.awsClusterForm = this.formBuilder.group({
      accessKeyId: [this.cloud.accessKeyId, [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secretAccessKey: [this.cloud.secretAccessKey, [<any>Validators.required, <any>Validators.minLength(2)]],
      vpcId: [this.cloud.vpcId],
      subnetId: [this.cloud.subnetId],
      routeTableId: [this.cloud.routeTableId],
      aws_cas: [false]
    });
    console.log(this.cloud.routeTableId);
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

    this.syncProviderCloudSpec.emit(awsCloudSpec);
  }
}
