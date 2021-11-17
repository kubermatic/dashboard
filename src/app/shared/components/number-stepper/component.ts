// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DecimalPipe} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  HostBinding,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
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
  Pattern = 'pattern',
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
export class NumberStepperComponent implements AfterViewInit, OnDestroy, ControlValueAccessor, Validator {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _integerPattern = /^[-]?[0-9]*$/;
  @ViewChild('input') private readonly _model: NgModel;
  private _onChange: (_: number | string) => void = noop;
  private _valid = false;
  @Input() label: string;
  @Input() hint: string;
  @Input() min: number;
  @Input() max: number;
  @Input() required = false;
  @Input() disabled = false;
  @Input() step = 1;
  @Input() type: 'integer' | 'decimal' = 'integer';

  @HostBinding('attr.id')
  protected _hostID = '';
  private _id = '';

  @Input()
  set id(value: string) {
    this._id = value;
    this._hostID = null;
  }

  get id(): string {
    return this._id;
  }

  /**
   * Defines internal behavior of the stepper field.
   *    raw - all additional error/hint messages will be hidden
   *    errors - only error message will be shown
   *    hint - only hint message will be shown
   *    all - both error and hint messages will be shown
   */
  @Input() mode: 'raw' | 'errors' | 'hint' | 'all' = 'raw';

  private _focus = false;

  get focus(): boolean {
    return this._focus;
  }

  @Input() set focus(focus: boolean | '') {
    this._focus = focus === '' || focus;
  }

  private _value: number | string;

  get value(): number | string {
    return this._value;
  }

  set value(val: number | string) {
    const parsed = this.type === 'decimal' ? this._decimalPipe.transform(val, '1.0-4') : val?.toString();
    if (!Number.isNaN(parsed) && parsed !== null) {
      this._value = this.type === 'decimal' ? Number.parseFloat(parsed) : Number.parseInt(parsed);
      this._onChange(val);
    }
  }

  get errors(): string[] {
    if (this.mode !== 'errors' && this.mode !== 'all') {
      return [];
    }

    return Object.values(this._getErrors());
  }

  get pattern(): string | RegExp {
    return this.type === 'integer' ? this._integerPattern : '';
  }

  constructor(private readonly _decimalPipe: DecimalPipe) {}

  ngAfterViewInit(): void {
    this._model.statusChanges.subscribe(status => {
      this._valid = status === 'VALID';
      this._onChange(this.value);
    });
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

  validate(_?: AbstractControl): ValidationErrors | null {
    if (this._valid) {
      return null;
    }

    return this._getErrors();
  }

  onIncrease(): void {
    if (this.max !== undefined && +this._value + +this.step > this.max) {
      return;
    }

    this.value = +this._value + +this.step;
  }

  onDecrease(): void {
    if (this.min !== undefined && +this._value - +this.step < this.min) {
      return;
    }

    this.value = +this._value - +this.step;
  }

  private _getErrors(): ValidationErrors {
    const errors: ValidationErrors = {};

    if (this._model?.hasError(Error.Required)) {
      errors[Error.Required] = `${this.label} is required.`;
    }

    if (this._model?.hasError(Error.Max)) {
      errors[Error.Max] = `Maximum acceptable value is ${this.max}.`;
    }

    if (this._model?.hasError(Error.Min)) {
      errors[Error.Min] = `Minimum acceptable value is ${this.min}.`;
    }

    if (this._model?.hasError(Error.Pattern)) {
      errors[Error.Pattern] = 'Expected provided number to be an integer.';
    }

    return errors;
  }
}
