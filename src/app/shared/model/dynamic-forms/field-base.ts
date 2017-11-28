export class FieldBase<T>{
    value: T;
    key: string;
    placeholder: string;
    required: boolean;
    errorMessage: string;
    order: number;
    controlType: string;
    minLength: number;
    maxLength: number;
    minNumber: number;

    constructor(options: {
        value?: T,
        key?: string,
        placeholder?: string,
        required?: boolean,
        errorMessage?: string,
        order?: number,
        controlType?: string
    } = {}) {
        this.value = options.value;
        this.key = options.key || '';
        this.placeholder = options.placeholder || '';
        this.required = !!options.required;
        this.errorMessage = options.errorMessage || '';
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';
    }
}
