import {EventEmitter} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

enum ValidationStrategy {
  Default = 'default',
}

enum ControlsValidationStrategy {
  Default = 'default',
}

export class FormHelper {
  private readonly _form: FormGroup;
  private _controls: AbstractControl[];
  private _onControlsStrategyChange = new EventEmitter<ControlsValidationStrategy>();

  private _validationStrategy: FormValidationStrategy;
  private _controlsValidationStrategy: FormValidationStrategy;
  private _controlsValidationStrategyType = ControlsValidationStrategy.Default;

  constructor(form: FormGroup) {
    this._form = form;
    this._validationStrategy = new DefaultFormValidationStrategy(form);
    this._setControlsValidationStrategy(ControlsValidationStrategy.Default);

    this._onControlsStrategyChange.subscribe(strategyType => {
      this._setControlsValidationStrategy(strategyType);
    });
  }

  private _setControlsValidationStrategy(strategy: ControlsValidationStrategy): void {
    switch (strategy) {
      case ControlsValidationStrategy.Default:
        this._controlsValidationStrategy = new EmptyFormControlsValidationStrategy(this._controls);
    }
  }

  setValidationStrategy(strategy: ValidationStrategy): void {
    switch (strategy) {
      case ValidationStrategy.Default:
        this._validationStrategy = new DefaultFormValidationStrategy(this._form);
    }
  }

  setControlsValidationStrategy(strategy: ControlsValidationStrategy): void {
    this._onControlsStrategyChange.emit(strategy);
  }

  registerFormControls(...controls: AbstractControl[]): void {
    this._controls = controls;
    this._setControlsValidationStrategy(this._controlsValidationStrategyType);
  }

  registerFormControl(control: AbstractControl): void {
    this._controls.push(control);
  }

  isFormValid(): boolean {
    return this._validationStrategy.isValid();
  }

  areControlsValid(): boolean {
    return this._controlsValidationStrategy.isValid();
  }
}

interface FormValidationStrategy {
  isValid(): boolean;
}

export class DefaultFormValidationStrategy implements FormValidationStrategy {
  private _validStatuses = ['VALID', 'DISABLED'];
  private _form: FormGroup;

  constructor(form: FormGroup) {
    this._form = form;
  }

  isValid(): boolean {
    return this._validStatuses.includes(this._form.status);
  }
}

export class EmptyFormControlsValidationStrategy implements FormValidationStrategy {
  private _controls = [];

  constructor(controls: AbstractControl[]) {
    this._controls = controls;
  }

  isValid(): boolean {
    return this._controls.every(control => {
      return control.value === null || control.value.toString().length === 0;
    });
  }
}
