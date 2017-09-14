import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {DigitaloceanCloudSpec} from "../../../api/entitiy/cloud/DigitialoceanCloudSpec";

@Component({
  selector: 'kubermatic-cluster-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanClusterComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncCloudSpec = new EventEmitter();

  public digitalOceanClusterForm: FormGroup;
  public cloudSpec;

  ngOnInit() {
    this.digitalOceanClusterForm = this.formBuilder.group({
      access_token: ["", [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
    });
  }

  public onChange(){
    this.cloudSpec = new DigitaloceanCloudSpec(this.digitalOceanClusterForm.controls["access_token"].value);

    this.syncCloudSpec = this.cloudSpec;
  }

}
