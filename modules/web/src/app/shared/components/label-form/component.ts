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

import {
  Component,
  DoCheck,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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
import {KeyValueEntry} from '@shared/types/common';
import {LabelFormValidators} from '../../validators/label-form.validators';
import {ControlsOf} from '../../model/shared';
import {DialogModeService} from '@app/core/services/dialog-mode';
import _ from 'lodash';
import {StaticLabel} from '@app/shared/entity/settings';

@Component({
    selector: 'km-label-form',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
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
    standalone: false
})
export class LabelFormComponent implements OnChanges, OnInit, OnDestroy, ControlValueAccessor, AsyncValidator, DoCheck {
  @Input() title = 'Labels';
  @Input() keyName = 'Key';
  @Input() valueName = 'Value';
  @Input() labels: Record<string, string>;
  @Input() staticLabels: StaticLabel[] = [];
  @Input() disabledLabel: KeyValueEntry;
  @Input() disabledLabelTooltip: string;
  @Input() canDeleteDisabledLabel: boolean;
  @Input() labelHint: string;
  @Input() labelHintKey: string;
  @Input() inheritedLabels: object = {};
  @Input() noValidators = false;
  @Input() hideRestrictedLabels = false;
  @Input() asyncKeyValidators: AsyncValidatorFn[] = [];
  @Output() labelsChange = new EventEmitter<object>();

  form: FormGroup;
  initialLabels: Record<string, string>;
  removedLabels: {key: string; value: string}[] = [];
  disabledLabelFormGroup: FormGroup<ControlsOf<{key: string; value: string}>>;
  valuesListOpen = false;
  keysListOpen = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _dialogModeService: DialogModeService
  ) {}

  get labelArray(): FormArray {
    return this.form?.get('labels') as FormArray;
  }

  static filterNullifiedKeys(labels: Record<string, string>): Record<string, string> {
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

  ngOnChanges(changes: SimpleChanges) {
    this.labels = this.labels ?? {};

    this.inheritedLabels = this.inheritedLabels ?? {};

    if (!this.form) {
      this._initForm();
    }
    if (changes?.disabledLabel) {
      const [key = '', value = ''] = this.disabledLabel ?? [];

      if (this.disabledLabelFormGroup) {
        this.disabledLabelFormGroup.patchValue({key, value});
      } else {
        this.disabledLabelFormGroup = this._formBuilder.group({
          key: this._formBuilder.control({value: key, disabled: true}),
          value: this._formBuilder.control({value, disabled: true}),
        });
      }

      if (key && value) {
        const removeLabelIndex = (this.labelArray?.value as {key: string; value: string}[]).findIndex(
          label => label.key === key
        );

        if (removeLabelIndex >= 0) {
          this.labelArray.removeAt(removeLabelIndex);
        }
      }

      if (key || value || !_.isEmpty(this.labels)) {
        this._updateLabelsObject();
      }
    }
  }

  ngOnInit(): void {
    // Make sure that labels object exist.
    if (!this.labels) {
      this.labels = {};
    }

    this.inheritedLabels = this.inheritedLabels ? this.inheritedLabels : {};

    // Save initial state of labels.
    this.initialLabels = this.labels;

    this.form?.valueChanges.subscribe(value => {
      this.removedLabels = this.removedLabels.filter(removedlabel => {
        return !value.labels.some(label => removedlabel?.key === label?.key);
      });
    });
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

  isLabelsChange(index: number): boolean {
    const key = this.labels[Object.keys(this.labels)[index]];
    const value = this.labels[Object.values(this.labels)[index]];
    if (key) {
      return (
        (key !== this.initialLabels[Object.keys(this.labels)[index]] ||
          value !== this.initialLabels[Object.values(this.labels)[index]]) &&
        this._dialogModeService.isEditDialog
      );
    }
    return false;
  }

  private _initForm() {
    // Initialize labels form.
    this.form = this._formBuilder.group({labels: this._formBuilder.array([])});
    // Add the default labels.
    if (_.isEmpty(this.labels) && this.staticLabels?.length) {
      this.staticLabels
        .sort((a, b) => Number(b.protected) - Number(a.protected))
        .forEach(label => {
          if (label.default || label.protected) {
            this._addLabel(label.key, label.values[0]);
          }
        });
    }

    // Setup labels form with label data.
    const filteredLabels = Object.keys(LabelFormComponent.filterNullifiedKeys(this.labels));
    if (filteredLabels.length > 0) {
      filteredLabels.forEach(key => {
        this._addLabel(key, this.labels[key]);
      });
    }
    // Add initial label for the user.
    this._addLabel();
    this._updateLabelsObject();
  }

  isRemovable(index: number): boolean {
    return (
      index < this.labelArray.length - 1 &&
      !this._isInherited(Object.keys(this.labels)[index]) &&
      !this.isProtectedKey(this.labelArray.controls[index].get('key').value, index)
    );
  }

  getKeyValues(key: string): string[] {
    return this.staticLabels?.find(label => label.key === key)?.values;
  }

  getStaticLabelsKeys(): string[] {
    const filteredLabels = this.staticLabels?.filter(label => {
      return !Object.keys(this.labels).includes(label.key);
    });

    return filteredLabels?.map(label => label.key);
  }

  isProtectedKey(key: string, index: number): boolean {
    return (
      !!this.staticLabels?.find(label => label.protected && label.key === key) &&
      !this.labelArray.controls[index]?.get('key').errors?.validLabelKeyUniqueness
    );
  }

  deleteLabel(index: number): void {
    if (this.isProtectedKey(this.labelArray.controls[index].get('key').value, index)) {
      return;
    }
    if (this._dialogModeService.isEditDialog) {
      this.removedLabels.push(this.labelArray.value[index]);
    }

    this.labelArray.removeAt(index);
    this._updateLabelsObject();
  }

  deleteDisabledLabel(): void {
    const key = this.disabledLabelFormGroup?.value.key;
    const value = this.disabledLabelFormGroup?.value.value;
    if (this._dialogModeService.isEditDialog) {
      this.removedLabels.push({key, value});
    }
    this.disabledLabelFormGroup = null;
    this.disabledLabel = null;

    this._updateLabelsObject();
  }

  check(index: number): void {
    this._addLabelIfNeeded();
    this._validateKey(index);
    this._updateLabelsObject();
  }

  private _isInherited(labelKey: string): boolean {
    return Object.keys(this.inheritedLabels ?? {}).includes(labelKey);
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.labelArray.at(this.labelArray.length - 1);
    if (LabelFormComponent._isFilled(lastLabel)) {
      this._addLabel();
    }
  }

  private _addLabel(key = '', value = ''): void {
    if (this.noValidators) {
      this.labelArray.push(
        this._formBuilder.group({
          key: [{value: key, disabled: this._isInherited(key)}],
          value: [{value, disabled: this._isInherited(key)}],
        })
      );
    } else {
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
    if (this.disabledLabelFormGroup?.value.key && this.disabledLabelFormGroup?.value.key === currentKey) {
      return true;
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

    if (this.initialLabels) {
      // Nullify initial labels data (it is needed to make edit work as it uses JSON Merge Patch).
      Object.keys(this.initialLabels).forEach(initialKey => {
        if (!Object.prototype.hasOwnProperty.call(labelsObject, initialKey)) {
          labelsObject[initialKey] = null;
        }
      });
    }

    const disabledLabelKey = this.disabledLabelFormGroup?.value.key;
    const disabledLabelValue = this.disabledLabelFormGroup?.value.value;
    if (disabledLabelKey && disabledLabelValue) {
      labelsObject[disabledLabelKey] = disabledLabelValue;
    }

    // Update labels object.
    this.labels = labelsObject;

    // Emit the change event.
    this.labelsChange.emit(this.labels);
  }
}
