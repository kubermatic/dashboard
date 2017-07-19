import {Component, OnInit, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ApiService} from "../../../api/api.service";

@Component({
  selector: 'kubermatic-setting-form-do',
  templateUrl: './setting-form-do.component.html',
  styleUrls: ['./setting-form-do.component.scss']
})
export class SettingFormDoComponent implements OnInit {

  @Input() cluster: string;

  constructor(private formBuilder: FormBuilder, private api: ApiService) { }

  public settingsDOForm: FormGroup;
  public sshKeys: any = [];

  ngOnInit() {

    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });

    this.settingsDOForm = this.formBuilder.group({
      id_token: [this.cluster['digitalocean'].token, [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
      ssh_key: ["", [<any>Validators.required]]
    })
  }

}
