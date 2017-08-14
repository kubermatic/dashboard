import {Component, OnInit, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {ApiService} from "../../api/api.service";

@Component({
  selector: 'kubermatic-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {

  @Input() cluster: string;
  @Input() dc: string;

  constructor(private formBuilder: FormBuilder, private api: ApiService) { }



  ngOnInit() {

    console.log(this.dc);
    console.log(this.cluster);

  }

  public saveValidForm () {
    //return this.settingsAWSForm.valid;
  }

  public saveSettings(): void {
    //to do
  }

}
