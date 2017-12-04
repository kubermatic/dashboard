import { FieldBase } from './field-base';

export class TextboxField extends FieldBase<string> {
  controlType = 'textbox';
  type: string;
  minLength: number;
  maxLength: number;
  minNumber: number;

  constructor(options: {} = {}) {
    super(options);
    this.type = options['type'] || '';
    this.minLength = options['minLength'] || null;
    this.maxLength = options['maxLength'] || null;
    this.minNumber = options['minNumber'] && this.type === 'number' ? options['minNumber'] : null;
  }
}
