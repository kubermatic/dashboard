import {Component, OnInit, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ApiService} from "../../../api/api.service";

@Component({
  selector: 'kubermatic-setting-form-os',
  templateUrl: './setting-form-os.component.html',
  styleUrls: ['./setting-form-os.component.scss']
})
export class SettingFormOsComponent implements OnInit {
  @Input() cluster: string;

  constructor(private formBuilder: FormBuilder, private api: ApiService) { }

  public settingsOSForm: FormGroup;
  public sshKeys: any = [];

  ngOnInit() {

    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });

    this.settingsOSForm = this.formBuilder.group({
      os_project_name: ["", [<any>Validators.required]],
      os_username: ["", [<any>Validators.required]],
      os_password: ["", [<any>Validators.required]],
      ssh_key: ["", [<any>Validators.required]]
    })
  }
}
