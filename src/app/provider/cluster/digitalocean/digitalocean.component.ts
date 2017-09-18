import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {DigitaloceanCloudSpec} from "../../../api/entitiy/cloud/DigitialoceanCloudSpec";

@Component({
  selector: 'kubermatic-cluster-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanClusterComponent implements OnInit {
  public digitalOceanClusterForm: FormGroup;
  public cloudSpec: DigitaloceanCloudSpec;

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncCloudSpec = new EventEmitter();

  ngOnInit() {
    this.digitalOceanClusterForm = this.formBuilder.group({
      access_token: ["", [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
    });
  }

  public onChange(){
    this.cloudSpec = new DigitaloceanCloudSpec(this.digitalOceanClusterForm.controls["access_token"].value);

    if (this.digitalOceanClusterForm.valid){
      this.syncCloudSpec.emit(this.cloudSpec);
    }
  }

  // ToDo: Pass token to the node component
  public changeDoKey() {
    let key = this.digitalOceanClusterForm.controls["access_token"].value;

    //this.api.getDigitaloceanSizes(key).subscribe(result => {
        //this.nodeSize = result.sizes;
     // }
    //);
  }

}
