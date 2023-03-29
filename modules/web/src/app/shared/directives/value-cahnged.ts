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

import {Directive, ElementRef, OnInit} from '@angular/core';
import {NgControl} from '@angular/forms';
import {take} from 'rxjs';
import {DialogModeService} from '@app/core/services/dialog-mode';

@Directive({
  selector: '[valueChanged]',
})
export class VlaueChangedDirective implements OnInit {
  // this array is for the fields initial value that been set before updating the values in the edit dialog.
  initialValuesArr = [undefined, ''];
  private _previousValue: any;
  test: any;

  constructor(private _el: ElementRef, private _control: NgControl, private _isEditDialog: DialogModeService) {}

  ngOnInit(): void {
    if (!this._isEditDialog.isEditDialog) {
      return;
    }

    const element = this._el.nativeElement;
    this._previousValue = this._control.control.value;

    switch (element.classList[0]) {
      case 'mat-input-element':
        this._control.control.valueChanges.pipe(take(1)).subscribe(value => {
          this._previousValue =
            !this.initialValuesArr.includes(this._previousValue) && !this._previousValue ? value : this._previousValue;
        });
        break;
      case 'mat-checkbox':
        this._previousValue = this._control.control.value === null ? false : this._control.control.value;
        break;
      case 'mat-radio-group':
        element.classList.toggle('radio-group-column', element.style.flexDirection === 'column');
        break;
      default:
        this._previousValue = this._control.control.value;
        break;
    }

    this._control?.control?.valueChanges.subscribe(value => {
      switch (element.classList[0]) {
        case 'mat-select':
          this.addClassToMatSelect(element, value);
          break;
        case 'mat-input-element':
          element.classList.toggle('value-changed', this._previousValue !== value);
          break;
        case 'mat-radio-group':
          this._previousValue = !this._previousValue ? value : this._previousValue;
          element.classList.toggle('value-changed', this._previousValue !== value);
          break;
        case 'ngx-monaco-editor':
          this._previousValue = this._previousValue === null ? value : this._previousValue;
          element.classList.toggle('value-changed', this._previousValue !== value);
          break;
        default:
          this._previousValue = this.initialValuesArr.includes(this._previousValue) ? value : this._previousValue;
          element.classList.toggle('value-changed', this._previousValue !== value);
      }
    });
  }

  isArraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1?.length !== arr2?.length) {
      return false;
    }
    for (let i = 0; i < arr1?.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }

  addClassToMatSelect(element: any, value: any): void {
    const classList = [...element.classList];

    if (classList?.includes('mat-select-multiple')) {
      if (this._previousValue && value) {
        element.classList.toggle('value-changed', !this.isArraysEqual(this._previousValue, value));
      } else if (!this._previousValue && (!value || !value?.length)) {
        element.classList.remove('value-changed');
      } else {
        element.classList.add('value-changed');
      }
    } else {
      this._previousValue = !this._previousValue ? value : this._previousValue;
      element.classList.toggle('value-changed', this._previousValue !== value);
    }
  }
}
