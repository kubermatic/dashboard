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

import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {Component, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {KmValidators} from '@shared/validators/validators';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Validators} from '@angular/forms';

enum Controls {
  Tags = 'tags',
}

@Component({
  selector: 'km-chip-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipListComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ChipListComponent),
      multi: true,
    },
  ],
})
export class ChipListComponent implements OnChanges, OnDestroy, ControlValueAccessor, Validator {
  private _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  @Input() title: string;
  @Input() label: string;
  @Input() description = 'Use comma, space or enter key as the separator.';
  @Input() placeholder: string;
  @Input() disabled: boolean;
  @Input('kmRequired') required: boolean;
  @Input('kmPatternError') patternError = 'Invalid pattern';
  @Input('kmPattern') pattern: string;
  @Input() tags: string[] = [];
  @Output() onChange = new EventEmitter<string[]>();
  form: FormGroup;
  separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];

  constructor(private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this._builder.group({[Controls.Tags]: this._builder.control(this.tags, this._validators())});
    if (this.disabled) {
      this.form.get(Controls.Tags).disable();
    }
    this.onChange.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.form.get(Controls.Tags).setValue(this.tags);
      this.form.get(Controls.Tags).updateValueAndValidity();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.disabled && this.form) {
      if (this.disabled) {
        this.form.get(Controls.Tags).disable();
        this.form.get(Controls.Tags).clearValidators();
      } else if (this.form.get(Controls.Tags).disabled) {
        this.form.get(Controls.Tags).enable();
        this.form.get(Controls.Tags).setValidators(this._validators());
        this.form.get(Controls.Tags).updateValueAndValidity();
      }
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  validate(_: AbstractControl): ValidationErrors {
    return this.form.get(Controls.Tags)?.valid ? null : this.form.get(Controls.Tags)?.errors;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (!value) {
      return;
    }

    event.chipInput?.clear();
    const delimiters = [',', ' '];
    const splitRegex = new RegExp(`[${delimiters.join('')}]`);
    if (splitRegex.test(value)) {
      const multiTags = value.split(splitRegex);
      multiTags.filter(val => !!val.trim()).forEach(val => this.tags.push(val.trim()));
    } else {
      this.tags.push(value);
    }
    this.onChange.emit(this.tags);
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }

    this.onChange.emit(this.tags);
  }

  writeValue(tags: string[]): void {
    if (!_.isEmpty(tags)) {
      this.form.get(Controls.Tags).setValue(tags, {emitEvent: false});
      this.tags = tags;
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(_: any): void {}

  private _validators(): ValidatorFn[] {
    const validators = [KmValidators.unique()];

    if (this.required) {
      validators.push(Validators.required);
    }

    if (this.pattern) {
      validators.push(KmValidators.chipPattern(this.pattern));
    }
    return validators;
  }
}
