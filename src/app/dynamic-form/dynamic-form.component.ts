import { Component, Input }  from '@angular/core';
import { FormGroup }                 from '@angular/forms';

import { FieldBase } from '../shared/model/dynamic-forms/field-base';
 
@Component({
  selector: 'kubermatic-dynamic-form',
  templateUrl: './dynamic-form.component.html'
})
export class DynamicFormComponent {
 
  @Input() fields: FieldBase<any>[] = [];
  @Input() form: FormGroup;
  payLoad = '';
 
  constructor() {  }
 
  onSubmit() {
    this.payLoad = JSON.stringify(this.form.value);
  }
}
