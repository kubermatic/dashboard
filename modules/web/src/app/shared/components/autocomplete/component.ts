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

import {Component, forwardRef, Input, OnInit, SimpleChanges} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidatorFn, Validators} from '@angular/forms';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

export const AutocompleteInitialState = {
  main: '',
};

export enum AutocompleteControls {
  Main = 'main',
}

@Component({
    selector: 'km-autocomplete',
    styleUrls: ['./style.scss'],
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutocompleteComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AutocompleteComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class AutocompleteComponent extends BaseFormValidator implements OnInit {
  @Input() label: string;
  @Input() required = false;
  @Input() isLoading = false;
  @Input() options: string[] = [];
  @Input() validators: ValidatorFn[] = [];
  @Input() disabled: boolean;
  controls = AutocompleteControls;
  isDropdownOpen: boolean;
  search: string = '';

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.disabled && this.form) {
      if (this.disabled) {
        this.form.get(AutocompleteControls.Main).disable();
      } else if (this.form.get(AutocompleteControls.Main).disabled) {
        this.form.get(AutocompleteControls.Main).enable();
      }
    }
  }

  ngOnInit(): void {
    if (this.required) {
      this.validators = [Validators.required, ...this.validators];
    }

    this.form = this._builder.group({
      [AutocompleteControls.Main]: this._builder.control('', this.validators),
    });

    if (this.disabled) {
      this.form.get(AutocompleteControls.Main).disable();
    }
  }

  onDropdownOpened(): void {
    this.isDropdownOpen = true;
    this.search = '';
  }

  onDropdownClosed(): void {
    this.isDropdownOpen = false;
  }
}
