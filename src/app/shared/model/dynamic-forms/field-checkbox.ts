import { FieldBase } from './field-base';

export class CheckboxField extends FieldBase<string> {
    controlType = 'checkbox';

    constructor(options: {} = {}) {
        super(options);
    }
}
