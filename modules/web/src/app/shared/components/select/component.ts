// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidatorFn, Validators} from '@angular/forms';
import {BaseFormValidator} from '@app/shared/validators/base-form.validator';
import {takeUntil} from 'rxjs/operators';

export enum Controls {
  Select = 'select',
}

@Component({
    selector: 'km-select',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class SelectComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  form: FormGroup;
  @Input() options: string[];
  @Input() label: string;
  @Input() isLoading = false;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() isMultiple = false;
  @Input() validators: ValidatorFn[] = [];

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    if (this.required) {
      this.validators = [Validators.required, ...this.validators];
    }

    this.form = this._builder.group({
      [Controls.Select]: this._builder.control('', this.validators),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  writeValue(value: string): void {
    this.form.get(Controls.Select).setValue(value, {emitEvent: false});
  }

  registerOnChange(fn: () => unknown): void {
    this.form.get(Controls.Select).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }
}
