import { NgRedux } from '@angular-redux/store';
import { CloudSpec } from './../../../../shared/entity/ClusterEntity';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {DigitaloceanCloudSpec} from "../../../../shared/entity/cloud/DigitialoceanCloudSpec";

import {InputValidationService} from '../../../../core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-cluster-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanClusterComponent implements OnInit {
  public digitalOceanClusterForm: FormGroup;

  constructor(private formBuilder: FormBuilder, 
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  @Input() cloud: DigitaloceanCloudSpec;
  @Output() syncProviderCloudSpec = new EventEmitter();

  ngOnInit() {
    this.digitalOceanClusterForm = this.formBuilder.group({
      access_token: [this.cloud.token, [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
    });
  }

  public onChange() {
    const doCloudSpec = new DigitaloceanCloudSpec(this.digitalOceanClusterForm.controls["access_token"].value);

    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, doCloudSpec, null, null, null, null)
    );

    this.syncProviderCloudSpec.emit(doCloudSpec);
  }
}
