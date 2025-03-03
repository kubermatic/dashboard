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

import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_ASYNC_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {Observable, of, Subject} from 'rxjs';
import {IPV4_CIDR_PATTERN_VALIDATOR} from '@shared/validators/others';

@Component({
  selector: 'km-cidr-form',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CIDRFormComponent),
      multi: true,
    },
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => CIDRFormComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class CIDRFormComponent implements OnInit, OnDestroy, ControlValueAccessor, AsyncValidator {
  @Input() title = '';
  @Input() cidrs: string[] = [];
  @Output() cidrsChange = new EventEmitter<string[]>();
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({cidrs: this._formBuilder.array([])});
    this.cidrs.forEach(cidr => this._addControl(cidr));
    this._addControl();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get controls(): FormArray {
    return this.form.get('cidrs') as FormArray;
  }

  private _addControl(cidr = ''): void {
    this.controls.push(this._formBuilder.control(cidr, [IPV4_CIDR_PATTERN_VALIDATOR]));
  }

  private _onChange(): void {
    this.cidrs = this.controls.getRawValue().filter(v => !!v);
    this.cidrsChange.emit(this.cidrs);
  }

  isRemovable(index: number): boolean {
    return index < this.controls.length - 1;
  }

  delete(index: number): void {
    this.controls.removeAt(index);
    this._onChange();
  }

  check(): void {
    if (this.controls.at(this.controls.length - 1).value) {
      this._addControl();
    }
    this._onChange();
  }

  onTouched(): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.form.disable() : this.form.enable();
  }

  validate(_: AbstractControl): Observable<ValidationErrors | null> {
    return of(this.form.valid ? null : {invalid: true});
  }
}
