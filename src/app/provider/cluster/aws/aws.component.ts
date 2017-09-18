import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AWSCloudSpec} from "../../../api/entitiy/cloud/AWSCloudSpec";

@Component({
  selector: 'kubermatic-cluster-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AWSClusterComponent implements OnInit {
  public awsClusterForm: FormGroup;
  public cloudSpec: AWSCloudSpec;

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncCloudSpec = new EventEmitter();

  ngOnInit() {
    this.awsClusterForm = this.formBuilder.group({
      access_key_id: ["", [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secret_access_key: ["", [<any>Validators.required, <any>Validators.minLength(2)]],
      vpc_id: [""],
      subnet_id: [""],
      route_table_id: [""],
    });
  }

  public onChange(){
    this.cloudSpec = new AWSCloudSpec(
      this.awsClusterForm.controls["access_key_id"].value,
      this.awsClusterForm.controls["secret_access_key"].value,
      this.awsClusterForm.controls["vpc_id"].value,
      this.awsClusterForm.controls["subnet_id"].value,
      this.awsClusterForm.controls["route_table_id"].value,
      "",
    )

    if (this.awsClusterForm.valid){
      this.syncCloudSpec.emit(this.cloudSpec);
    }
  }
}
