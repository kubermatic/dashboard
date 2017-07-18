import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";

@Component({
  selector: 'kubermatic-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  public settingsForm: FormGroup;
  public sshKeys: any = [];


  ngOnInit() {

    this.settingsForm = this.formBuilder.group({
      access_key_id: ['', [<any>Validators.required, CustomValidators.rangeLength([16, 32])]],
      secret_access_key: ['', [<any>Validators.required]],
      sshKeys: ['', [<any>Validators.required]]
    });

  }

  public saveValidForm () {
    return this.settingsForm.valid;
  }

  public saveSettings(): void {
    //to do
  }

}
