// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Directive, ElementRef, Input, OnInit} from '@angular/core';
import {NgControl} from '@angular/forms';
import {DialogModeService} from '@app/core/services/dialog-mode';
import _ from 'lodash';

@Directive({
  selector: '[kmValueChangedIndicator]',
})
export class ValueChangedIndicatorDirective implements OnInit {
  private _initialValue: string | string[] | boolean | number;
  @Input() ValueChangedIndicator = true;

  constructor(
    private _el: ElementRef,
    private _control: NgControl,
    private _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    if (!this._dialogModeService.isEditDialog || !this.ValueChangedIndicator) {
      return;
    }

    const element = this._el.nativeElement;
    const classList = Array.from(element.classList);
    this._initialValue = _.cloneDeep(this._control.control.value);

    if (classList?.includes('mat-input-element')) {
      if (element.getAttribute('type') === 'number') {
        setTimeout(() => {
          this._initialValue = this._control.control.value;
        }, 0);
      } else {
        this._initialValue = this._initialValue === null ? '' : this._initialValue;
      }
    }

    if (classList?.includes('mat-mdc-checkbox')) {
      this._initialValue = this._control.control.value === null ? false : this._control.control.value;
    }

    if (classList.includes('mat-mdc-radio-group')) {
      element.classList.toggle('radio-group-column', element.style.flexDirection === 'column');
    }

    this._control?.control?.valueChanges.subscribe(value => {
      if (classList?.includes('mat-mdc-select')) {
        this.addClassToMatSelect(element, value);
      } else if (classList?.includes('mat-input-element')) {
        if (element.getAttribute('type') === 'number') {
          setTimeout(() => {
            element.classList.toggle('km-value-changed', this._initialValue !== value);
          }, 0);
        } else {
          element.classList.toggle('km-value-changed', this._initialValue !== value);
        }
      } else if (classList.includes('mat-radio-group')) {
        this._initialValue = !this._initialValue ? value : this._initialValue;
        element.classList.toggle('km-value-changed', this._initialValue !== value);
      } else if (classList.includes('ngx-monaco-editor-v2')) {
        this._initialValue = this._initialValue === null ? value : this._initialValue;
        element.classList.toggle('km-value-changed', this._initialValue !== value);
      } else if (classList?.includes('km-chip-list-with-input')) {
        element.parentElement.classList.toggle('km-value-changed', !_.isEqual(this._initialValue, value));
      } else {
        this._initialValue = this._initialValue === null ? value : this._initialValue;
        element.classList.toggle('km-value-changed', this._initialValue !== value);
      }
    });
  }

  addClassToMatSelect(element: HTMLElement, value: string | string[]): void {
    const classList = Array.from(element.classList);
    if (classList?.includes('mat-mdc-select-multiple')) {
      if (this._initialValue && value) {
        element.classList.toggle('km-value-changed', !_.isEqual(this._initialValue as string[], value as string[]));
      } else if (!this._initialValue && (!value || !value?.length)) {
        element.classList.remove('km-value-changed');
      } else {
        element.classList.add('km-value-changed');
      }
    } else {
      this._initialValue = !this._initialValue ? value : this._initialValue;
      element.classList.toggle('km-value-changed', this._initialValue !== value);
    }
  }
}
