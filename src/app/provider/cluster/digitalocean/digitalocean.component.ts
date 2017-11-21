import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {DigitaloceanCloudSpec} from "../../../api/entitiy/cloud/DigitialoceanCloudSpec";

import {InputValidationService} from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanClusterComponent implements OnInit {
  public digitalOceanClusterForm: FormGroup;
  public cloudSpec: DigitaloceanCloudSpec;

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  @Input() cloud: DigitaloceanCloudSpec;
  @Output() syncProviderCloudSpec = new EventEmitter();
  @Output() syncProviderCloudSpecValid = new EventEmitter();

  ngOnInit() {
    this.digitalOceanClusterForm = this.formBuilder.group({
      access_token: [this.cloud.token, [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
    });
  }

  public onChange(){
    this.cloudSpec = new DigitaloceanCloudSpec(this.digitalOceanClusterForm.controls["access_token"].value);


      this.syncProviderCloudSpec.emit(this.cloudSpec);
      this.syncProviderCloudSpecValid.emit(this.digitalOceanClusterForm.valid);
  }
}
