import {Component, forwardRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self} from '@angular/core';
import {AbstractControl, ControlValueAccessor, NgControl, ValidationErrors, Validator} from '@angular/forms';
import {MatFormFieldControl} from '@angular/material/form-field';
import {Subject} from 'rxjs';

@Component({
  selector: 'km-number-stepper',
  styleUrls: ['style.scss'],
  templateUrl: 'template.html',
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: forwardRef(() => NumberStepperComponent),
      multi: true,
    },
    // {
    //   provide: NG_VALUE_ACCESSOR,
    //   useExisting: forwardRef(() => NumberStepperComponent),
    //   multi: true,
    // },
    // {
    //   provide: NG_VALIDATORS,
    //   useExisting: forwardRef(() => NumberStepperComponent),
    //   multi: true,
    // },
  ],
})
export class NumberStepperComponent
  implements OnInit, OnDestroy, ControlValueAccessor, Validator, MatFormFieldControl<number>
{
  private readonly _unsubscribe = new Subject<void>();
  static nextId = 0;

  private _value: number;

  @Input()
  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
    this.stateChanges.next();
  }

  readonly stateChanges: Subject<void> = new Subject<void>();

  @HostBinding()
  readonly id: string = `km-number-stepper-${NumberStepperComponent.nextId++}`;

  private _placeholder: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }

  set placeholder(placeholder: string) {
    this._placeholder = placeholder;
  }

  readonly focused: boolean;
  get empty(): boolean {
    return !this.value;
  }

  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  private _required = false;

  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(req: boolean) {
    this._required = req;
    this.stateChanges.next();
  }

  private _disabled = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(disabled: boolean) {
    this._disabled = disabled;
    this.stateChanges.next();
  }

  readonly errorState: boolean;
  readonly controlType: string;
  readonly autofilled = false;
  readonly userAriaDescribedBy: string;

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl !== null) {
      this.ngControl.valueAccessor = this;
    }
  }

  setDescribedByIds(_ids: string[]): void {}

  onContainerClick(_event: MouseEvent): void {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  writeValue(value: number | null): void {
    if (value !== null) {
      this.value = value;
    }
  }

  registerOnChange(_fn: any): void {}

  registerOnTouched(_fn: any): void {}

  validate(_control: AbstractControl): ValidationErrors | null {
    return undefined;
  }

  onIncrease(): void {
    this.value++;
  }

  onDecrease(): void {
    if (this.value === 0) {
      return;
    }

    this.value--;
  }
}
