import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AWSCloudSpec} from "../../../api/entitiy/cloud/AWSCloudSpec";

import {InputValidationService} from '../../../services';


@Component({
  selector: 'kubermatic-cluster-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AWSClusterComponent implements OnInit {
  public awsClusterForm: FormGroup;
  public cloudSpec: AWSCloudSpec;

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  @Output() syncCloudSpec = new EventEmitter();

  ngOnInit() {
    this.awsClusterForm = this.formBuilder.group({
      accessKeyId: ["", [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secretAccessKey: ["", [<any>Validators.required, <any>Validators.minLength(2)]],
      vpcId: [""],
      subnetId: [""],
      routeTableId: [""],
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

    if (this.awsClusterForm.valid){
      this.syncCloudSpec.emit(this.cloudSpec);
    }
  }
}
