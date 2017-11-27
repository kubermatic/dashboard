import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { FieldBase } from '../model/dynamic-forms/field-base';

@Injectable()
export class FormControlService {
    constructor() { }

    toFormGroup(fields: FieldBase<any>[]) {
        let group: any = {};

        fields.forEach(field => {
            group[field.key] = field.required ? new FormControl(field.value || '', Validators.required)
                                                : new FormControl(field.value || '');
        });
        return new FormGroup(group);
    }
}
