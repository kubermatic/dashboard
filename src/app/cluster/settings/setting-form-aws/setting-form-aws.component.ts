import {Component, OnInit, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ApiService} from "../../../api/api.service";

@Component({
  selector: 'kubermatic-setting-form-aws',
  templateUrl: './setting-form-aws.component.html',
  styleUrls: ['./setting-form-aws.component.scss']
})
export class SettingFormAwsComponent implements OnInit {
  @Input() cluster: string;

  constructor(private formBuilder: FormBuilder, private api: ApiService) { }

  public settingsAWSForm: FormGroup;
  public sshKeys: any = [];


  ngOnInit() {

    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });

    this.settingsAWSForm = this.formBuilder.group({
      access_key_id: [this.cluster['aws'].access_key_id, [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secret_access_key: [this.cluster['aws'].secret_access_key, [<any>Validators.required, <any>Validators.minLength(2)]],
      ssh_key: ["", [<any>Validators.required]],
      vpc_id: [this.cluster['aws'].vpc_id],
      subnet_id: [this.cluster['aws'].subnet_id],
      auto_update: [this.cluster['aws'].container_linux.auto_update, [<any>Validators.required]]
    });
  }

}
