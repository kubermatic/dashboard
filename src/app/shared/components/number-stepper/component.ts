import {ChangeDetectionStrategy, Component, forwardRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgModel,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {noop, Subject} from 'rxjs';

enum Error {
  Required = 'required',
  Min = 'min',
  Max = 'max',
}

@Component({
  selector: 'km-number-stepper',
  styleUrls: ['style.scss'],
  templateUrl: 'template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberStepperComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NumberStepperComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberStepperComponent implements OnDestroy, ControlValueAccessor, Validator {
  private readonly _unsubscribe = new Subject<void>();
  private _onChange: (_: number) => void = noop;
  @Input() label: string;
  @Input() hint: string;
  @Input() min: number;
  @Input() max: number;
  @Input() required = false;
  @Input() disabled = false;

  /**
   * Defines internal behavior of the stepper field.
   *    raw - all additional error/hint messages will be hidden
   *    errors - only error message will be shown
   *    hint - only hint message will be shown
   *    all - both error and hint messages will be shown
   */
  @Input() mode: 'raw' | 'errors' | 'hint' | 'all' = 'raw';
  @ViewChild('input') model: NgModel;

  private _value: number;

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
    this._onChange(val);
  }

  get errors(): string[] {
    if (this.mode !== 'errors' && this.mode !== 'all') {
      return [];
    }

    return Object.values(this._getErrors());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  writeValue(value: number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (_: number) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {}

  validate(_control: AbstractControl): ValidationErrors | null {
    if (!this.model || this.model.valid) {
      return null;
    }

    return this._getErrors();
  }

  onIncrease(): void {
    if (this.value >= this.max) {
      return;
    }

    this.value = this._value + 1;
  }

  onDecrease(): void {
    if (this.value <= this.min) {
      return;
    }

    this.value = this._value - 1;
  }

  private _getErrors(): ValidationErrors {
    const errors: ValidationErrors = {};

    if (this.model?.hasError(Error.Required)) {
      errors[Error.Required] = `${this.label} is required.`;
    }

    if (this.model?.hasError(Error.Max)) {
      errors[Error.Max] = `Maximum acceptable value is ${this.max}.`;
    }

    if (this.model?.hasError(Error.Min)) {
      errors[Error.Min] = `Minimum acceptable value is ${this.min}.`;
    }

    return errors;
  }
}
