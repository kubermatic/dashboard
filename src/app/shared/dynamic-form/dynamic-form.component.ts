import { Component, Input, OnInit }  from '@angular/core';
import { FormGroup }                 from '@angular/forms';

import { FieldBase } from './../model/dynamic-forms/field-base';
import { FormControlService } from './form-control.service';
 
@Component({
  selector: 'kubermatic-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  providers: [ FormControlService ]
})
export class DynamicFormComponent implements OnInit {
 
  @Input() fields: FieldBase<any>[] = [];
  form: FormGroup;
  payLoad = '';
 
  constructor(private fcs: FormControlService) {  }
 
  ngOnInit() {
    this.form = this.fcs.toFormGroup(this.fields);
  }
 
  onSubmit() {
    this.payLoad = JSON.stringify(this.form.value);
  }
}