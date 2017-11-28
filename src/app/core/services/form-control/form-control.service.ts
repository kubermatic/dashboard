import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { FieldBase } from '../../../shared/model/dynamic-forms/field-base';

@Injectable()
export class FormControlService {
    constructor() { }

    toFormGroup(fields: FieldBase<any>[]) {
        let group: any = {};

        fields.forEach(field => {
            let validators = [];
            if (field.required) {
                validators.push(Validators.required);
            }
            if (field.minLength) {
                validators.push(Validators.minLength(field.minLength));
            }
            if (field.maxLength) {
                validators.push(Validators.maxLength(field.maxLength));
            }
            if (field.minNumber) {
                validators.push(Validators.min(1));
            }
            group[field.key] = validators.length ? new FormControl(field.value || '', validators)
                                                : new FormControl(field.value || '');
        });
        return new FormGroup(group);
    }
}
