import {Component, OnInit,Input, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AWSCloudSpec} from "../../../api/entitiy/cloud/AWSCloudSpec";

import {InputValidationService} from '../../../services';
import {CloudSpec} from "../../../api/entitiy/ClusterEntity";


@Component({
  selector: 'kubermatic-cluster-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AWSClusterComponent implements OnInit {
  public awsClusterForm: FormGroup;
  public cloudSpec: AWSCloudSpec;
  @Input() cloud: AWSCloudSpec;

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  @Output() syncProviderCloudSpec = new EventEmitter();
  @Output() syncProviderCloudSpecValid = new EventEmitter();

  ngOnInit() {
    this.awsClusterForm = this.formBuilder.group({
      accessKeyId: [this.cloud.accessKeyId, [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secretAccessKey: [this.cloud.secretAccessKey, [<any>Validators.required, <any>Validators.minLength(2)]],
      vpcId: [this.cloud.vpcId],
      subnetId: [this.cloud.subnetId],
      routeTableId: [this.cloud.routeTableId],
      aws_cas: [false]
    });
  }

  public onChange(){
    this.cloudSpec = new AWSCloudSpec(
      this.awsClusterForm.controls["accessKeyId"].value,
      this.awsClusterForm.controls["secretAccessKey"].value,
      this.awsClusterForm.controls["vpcId"].value,
      this.awsClusterForm.controls["subnetId"].value,
      this.awsClusterForm.controls["routeTableId"].value,
      "",
    )

    this.syncProviderCloudSpec.emit(this.cloudSpec);
    this.syncProviderCloudSpecValid.emit(this.awsClusterForm.valid);
  }
}
