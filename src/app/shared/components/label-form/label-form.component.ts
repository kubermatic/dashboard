// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, DoCheck, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  AsyncValidatorFn,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_ASYNC_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {Observable, of, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {LabelFormValidators} from '../../validators/label-form.validators';

@Component({
  selector: 'km-label-form',
  templateUrl: './label-form.component.html',
  styleUrls: ['./label-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LabelFormComponent),
      multi: true,
    },
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => LabelFormComponent),
      multi: true,
    },
  ],
})
export class LabelFormComponent implements OnInit, OnDestroy, ControlValueAccessor, AsyncValidator, DoCheck {
  @Input() title = 'Labels';
  @Input() labels: object;
  @Input() inheritedLabels: object = {};
  @Input() asyncKeyValidators: AsyncValidatorFn[] = [];
  @Output() labelsChange = new EventEmitter<object>();
  form: FormGroup;
  initialLabels: object;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _formBuilder: FormBuilder) {}

  get labelArray(): FormArray {
    return this.form.get('labels') as FormArray;
  }

  static filterNullifiedKeys(labels: object): object {
    const filteredLabelsObject = {};
    if (labels instanceof Object) {
      Object.keys(labels).forEach(key => {
        // Do not allow nullified (marked for removal) labels.
        if (labels[key] !== null) {
          filteredLabelsObject[key] = labels[key];
        }
      });
    }
    return filteredLabelsObject;
  }

  private static _isFilled(label: AbstractControl): boolean {
    return label.get('key').value.length !== 0;
  }

  ngOnInit(): void {
    // Initialize labels form.
    this.form = this._formBuilder.group({labels: this._formBuilder.array([])});

    // Make sure that labels object exist.
    if (!this.labels) {
      this.labels = {};
    }

    this.inheritedLabels = this.inheritedLabels ? this.inheritedLabels : {};

    // Save initial state of labels.
    this.initialLabels = this.labels;

    // Setup labels form with label data.
    const filteredLabels = Object.keys(LabelFormComponent.filterNullifiedKeys(this.labels));
    if (filteredLabels.length > 0) {
      filteredLabels.forEach(key => {
        this._addLabel(key, this.labels[key]);
      });
    }

    // Add initial label for the user.
    this._addLabel();
  }

  ngDoCheck(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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

  isRemovable(index: number): boolean {
    return index < this.labelArray.length - 1 && !this._isInherited(Object.keys(this.labels)[index]);
  }

  deleteLabel(index: number): void {
    this.labelArray.removeAt(index);
    this._updateLabelsObject();
  }

  check(index: number): void {
    this._addLabelIfNeeded();
    this._validateKey(index);
    this._updateLabelsObject();
  }

  private _isInherited(labelKey: string): boolean {
    return Object.keys(this.inheritedLabels).includes(labelKey);
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.labelArray.at(this.labelArray.length - 1);
    if (LabelFormComponent._isFilled(lastLabel)) {
      this._addLabel();
    }
  }

  private _addLabel(key = '', value = ''): void {
    this.labelArray.push(
      this._formBuilder.group({
        key: [
          {value: key, disabled: this._isInherited(key)},
          Validators.compose([
            LabelFormValidators.labelKeyNameLength,
            LabelFormValidators.labelKeyPrefixLength,
            LabelFormValidators.labelKeyNamePattern,
            LabelFormValidators.labelKeyPrefixPattern,
          ]),
          Validators.composeAsync(this.asyncKeyValidators),
        ],
        value: [
          {value, disabled: this._isInherited(key)},
          Validators.compose([LabelFormValidators.labelValueLength, LabelFormValidators.labelValuePattern]),
        ],
      })
    );
  }

  private _validateKey(index: number): void {
    const elem = this.labelArray.at(index).get('key');

    if (this._isKeyDuplicated(index)) {
      elem.setErrors({validLabelKeyUniqueness: true});
    }

    this.form.updateValueAndValidity();
  }

  private _isKeyDuplicated(index: number): boolean {
    let duplications = 0;
    const currentKey = this.labelArray.at(index).get('key').value;
    for (let i = 0; i < this.labelArray.length; i++) {
      const key = this.labelArray.at(i).get('key').value;
      if (key.length !== 0 && key === currentKey) {
        duplications++;
      }
      if (duplications > 1) {
        return true;
      }
    }
    return false;
  }

  private _updateLabelsObject(): void {
    // Create a new labels object.
    const labelsObject = {};

    // Fill it with current labels data.
    this.labelArray.getRawValue().forEach(kv => {
      if (kv.key.length !== 0) {
        labelsObject[kv.key] = kv.value;
      }
    });

    // Nullify initial labels data (it is needed to make edit work as it uses JSON Merge Patch).
    Object.keys(this.initialLabels).forEach(initialKey => {
      if (!Object.prototype.hasOwnProperty.call(labelsObject, initialKey)) {
        labelsObject[initialKey] = null;
      }
    });

    // Update labels object.
    this.labels = labelsObject;

    // Emit the change event.
    this.labelsChange.emit(this.labels);
  }
}
